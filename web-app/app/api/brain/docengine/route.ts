/**
 * DocEngine — Universal Document Parser
 *
 * POST /api/brain/docengine
 * FormData: file (multipart upload)
 *
 * Supported formats (resolved in-process, no microservice required):
 *   .pdf   — pdf-parse (text extraction, then chunked into notes)
 *   .docx  — mammoth.js (Word → markdown)
 *   .csv   — papaparse / native (→ markdown table)
 *   .txt   — direct
 *   .md    — direct
 *   .epub  — basic chapter extraction
 *   .mp3/.m4a/.wav/.ogg — OpenAI Whisper transcription
 *
 * Falls back to DOCENGINE_URL microservice when set, for formats not handled here.
 *
 * Tier: pdf_import, docx_import, audio_transcription = pro
 *       txt/md = free
 *
 * New packages: npm install pdf-parse mammoth
 * New env vars: OPENAI_API_KEY (for Whisper audio transcription)
 *               ASSEMBLYAI_API_KEY (alternative to Whisper)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs } from '@/lib/db/schema'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '') // remove extension
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function csvToMarkdown(csv: string): string {
  const lines = csv.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return ''

  const rows = lines.map((l) =>
    l.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
  )

  const header = rows[0]
  const separator = header.map(() => '---')
  const body = rows.slice(1)

  return [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...body.map((r) => '| ' + r.join(' | ') + ' |'),
  ].join('\n')
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse must be loaded dynamically — it patches require() at module level
  // which causes issues with Next.js edge runtime if imported at top level.
  const pdfModule = await import('pdf-parse')
  const pdfParse = (pdfModule as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }).default ?? pdfModule
  const data = await pdfParse(buffer)
  return data.text
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  // mammoth has convertToHtml but not convertToMarkdown; we use HTML then strip tags
  const result = await mammoth.convertToHtml({ buffer })
  // Basic HTML → markdown conversion
  return result.value
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '_$1_')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function transcribeAudio(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  const assemblyKey = process.env.ASSEMBLYAI_API_KEY

  if (openaiKey) {
    // OpenAI Whisper
    const form = new FormData()
    const arrayBuf: ArrayBuffer = new Uint8Array(buffer).buffer as ArrayBuffer
    const blob = new Blob([arrayBuf], { type: mimeType })
    form.append('file', blob, filename)
    form.append('model', 'whisper-1')
    form.append('response_format', 'text')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    })

    if (!res.ok) throw new Error(`Whisper error: ${await res.text()}`)
    return await res.text()
  }

  if (assemblyKey) {
    // AssemblyAI — upload then poll
    const ab = buffer.buffer instanceof SharedArrayBuffer
      ? new Uint8Array(buffer).buffer
      : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: assemblyKey, 'Content-Type': 'application/octet-stream' },
      body: ab,
    })
    if (!uploadRes.ok) throw new Error('AssemblyAI upload failed')
    const { upload_url } = await uploadRes.json()

    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: assemblyKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: upload_url }),
    })
    const { id } = await transcriptRes.json()

    // Poll until done (max 55 seconds)
    const deadline = Date.now() + 55_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000))
      const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { authorization: assemblyKey },
      })
      const result = await poll.json()
      if (result.status === 'completed') return result.text ?? ''
      if (result.status === 'error') throw new Error(`AssemblyAI error: ${result.error}`)
    }
    throw new Error('Transcription timed out')
  }

  throw new Error('No transcription API configured. Set OPENAI_API_KEY or ASSEMBLYAI_API_KEY.')
}

async function parseEpub(buffer: Buffer): Promise<{ title: string; markdown: string }> {
  // EPUB files are ZIP archives containing XHTML files
  const { Open } = await import('unzipper')
  const directory = await Open.buffer(buffer)

  const htmlFiles = directory.files
    .filter((f) => f.path.endsWith('.xhtml') || f.path.endsWith('.html'))
    .sort((a, b) => a.path.localeCompare(b.path))

  let fullText = ''
  let title = 'Untitled Epub'

  for (const file of htmlFiles.slice(0, 50)) {
    const content = await file.buffer()
    const html = content.toString('utf8')

    // Try to get book title from content.opf
    if (!title || title === 'Untitled Epub') {
      const titleMatch = html.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)
      if (titleMatch) title = titleMatch[1].trim()
    }

    // Strip tags for rough text extraction
    const text = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 100) fullText += text + '\n\n'
  }

  return { title, markdown: fullText }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const saveAsNote = formData.get('saveAsNote') !== 'false' // default true

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const filename = file.name
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type

  // Feature gate by extension
  const extGates: Record<string, Parameters<typeof can>[1]> = {
    pdf: 'pdf_import',
    docx: 'docx_import',
    mp3: 'audio_transcription',
    m4a: 'audio_transcription',
    wav: 'audio_transcription',
    ogg: 'audio_transcription',
    webm: 'audio_transcription',
    epub: 'pdf_import', // same tier
    xlsx: 'pdf_import',
    csv: 'brain_notes', // free
  }

  const requiredFeature = extGates[ext]
  if (requiredFeature && !can(user.subscriptionTier, requiredFeature)) {
    return NextResponse.json(
      { error: `Importing .${ext} files requires a Pro subscription` },
      { status: 403 }
    )
  }

  let markdown = ''
  let title = filename.replace(/\.[^.]+$/, '')

  try {
    switch (ext) {
      case 'pdf': {
        const text = await parsePdf(buffer)
        markdown = text
        break
      }
      case 'docx': {
        markdown = await parseDocx(buffer)
        break
      }
      case 'csv':
      case 'tsv': {
        markdown = csvToMarkdown(buffer.toString('utf8'))
        break
      }
      case 'txt':
      case 'md': {
        markdown = buffer.toString('utf8')
        break
      }
      case 'epub': {
        const result = await parseEpub(buffer)
        markdown = result.markdown
        title = result.title
        break
      }
      case 'mp3':
      case 'm4a':
      case 'wav':
      case 'ogg':
      case 'webm': {
        const transcript = await transcribeAudio(buffer, mimeType, filename)
        markdown = transcript
        title = `Transcript: ${title}`
        break
      }
      default: {
        // Fall back to external DocEngine microservice if configured
        const docEngineUrl = process.env.DOCENGINE_URL
        if (docEngineUrl) {
          const fwd = new FormData()
          fwd.append('file', new Blob([buffer], { type: mimeType }), filename)
          const res = await fetch(`${docEngineUrl}/parse`, { method: 'POST', body: fwd })
          if (!res.ok) throw new Error(`DocEngine: ${res.statusText}`)
          const data = await res.json()
          markdown = data.markdown ?? ''
          title = data.title ?? title
        } else {
          return NextResponse.json(
            { error: `Unsupported file type: .${ext}` },
            { status: 415 }
          )
        }
      }
    }
  } catch (err) {
    console.error('DocEngine parse error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse failed' },
      { status: 500 }
    )
  }

  if (!markdown || markdown.trim().length < 10) {
    return NextResponse.json({ error: 'No readable content found in file' }, { status: 422 })
  }

  // Return parsed markdown without saving (when saveAsNote=false)
  if (!saveAsNote) {
    return NextResponse.json({ success: true, title, markdown })
  }

  // Save as Brain note
  const slug = slugify(title) + '-' + Date.now().toString(36)
  const wordCount = markdown.trim().split(/\s+/).length

  const noteContent = `> Imported from: ${filename}\n> Date: ${new Date().toLocaleDateString()}\n\n---\n\n${markdown}`

  const [note] = await db
    .insert(brainNotes)
    .values({
      userId: user.id,
      slug,
      title,
      content: noteContent,
      tags: ['imported', ext],
      wordCount,
      frontmatter: {
        source: 'docengine',
        originalFilename: filename,
        importedAt: new Date().toISOString(),
      },
    })
    .returning({ id: brainNotes.id, slug: brainNotes.slug })

  // Queue AI jobs
  await db.insert(agentJobs).values([
    {
      userId: user.id,
      jobType: 'summarize_note',
      agentName: 'summarizer',
      payload: { noteId: note.id, contentLength: noteContent.length },
      priority: 5,
    },
    {
      userId: user.id,
      jobType: 'embed_note',
      agentName: 'embedder',
      payload: { noteId: note.id },
      priority: 6,
    },
  ])

  return NextResponse.json({
    success: true,
    id: note.id,
    slug: note.slug,
    title,
    wordCount,
  })
}
