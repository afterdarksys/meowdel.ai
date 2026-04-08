/**
 * Audio Transcription
 *
 * POST /api/brain/transcribe
 * FormData: file (audio blob — webm/mp3/m4a/wav)
 *           saveAsNote?: "true" — if present, save transcript as Brain note
 *           title?: string — note title when saveAsNote=true
 *
 * Providers (in priority order):
 *   1. OpenAI Whisper (OPENAI_API_KEY)
 *   2. AssemblyAI (ASSEMBLYAI_API_KEY)
 *
 * Tier: voice_notes (pro) — basic voice recording in editor is free via mock
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs } from '@/lib/db/schema'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function transcribeWithWhisper(blob: Blob, filename: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const form = new FormData()
  form.append('file', blob, filename)
  form.append('model', 'whisper-1')
  form.append('response_format', 'text')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err.error?.message ?? 'Whisper transcription failed')
  }

  return await res.text()
}

async function transcribeWithAssembly(blob: Blob): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY not configured')

  // Upload audio
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/octet-stream' },
    body: await blob.arrayBuffer(),
  })
  if (!uploadRes.ok) throw new Error('AssemblyAI upload failed')
  const { upload_url } = await uploadRes.json()

  // Request transcription
  const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: upload_url }),
  })
  const { id } = await transcriptRes.json()

  // Poll for completion
  const deadline = Date.now() + 55_000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500))
    const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: apiKey },
    })
    const result = await poll.json()
    if (result.status === 'completed') return result.text ?? ''
    if (result.status === 'error') throw new Error(`AssemblyAI: ${result.error}`)
  }

  throw new Error('Transcription timed out')
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  // Allow unauthenticated in-editor voice recording (no save) on free tier
  // Authenticated pro users can save as note

  const formData = await req.formData()
  const audioFile = formData.get('file') as File | Blob | null
  const saveAsNote = formData.get('saveAsNote') === 'true'
  const noteTitle = (formData.get('title') as string) ?? `Voice Note — ${new Date().toLocaleString()}`

  if (!audioFile) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

  if (saveAsNote && !user) {
    return NextResponse.json({ error: 'Authentication required to save voice notes' }, { status: 401 })
  }

  if (saveAsNote && user && !can(user.subscriptionTier, 'voice_notes')) {
    return NextResponse.json({ error: 'Saving voice notes requires Pro' }, { status: 403 })
  }

  const filename = audioFile instanceof File ? audioFile.name : 'recording.webm'

  let transcript: string

  // Try Whisper first, then AssemblyAI, then mock
  const openaiKey = process.env.OPENAI_API_KEY
  const assemblyKey = process.env.ASSEMBLYAI_API_KEY

  if (openaiKey) {
    transcript = await transcribeWithWhisper(audioFile, filename)
  } else if (assemblyKey) {
    transcript = await transcribeWithAssembly(audioFile)
  } else {
    // Development mock — rotate through realistic examples
    await new Promise((r) => setTimeout(r, 800))
    const mocks = [
      'This is a mock transcription. Set OPENAI_API_KEY or ASSEMBLYAI_API_KEY for real transcription.',
      'Just had an interesting idea about knowledge graphs and how they relate to human memory.',
      'Need to revisit the Docker networking chapter and add a section on overlay networks.',
      'The key insight from today is that spaced repetition works best when the intervals are adaptive.',
    ]
    transcript = mocks[Math.floor(Math.random() * mocks.length)]
  }

  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'No speech detected in audio' }, { status: 422 })
  }

  if (saveAsNote && user) {
    const slug =
      noteTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) +
      '-' + Date.now().toString(36)

    const noteContent = `> Voice note — ${new Date().toLocaleString()}\n\n---\n\n${transcript}`

    const [note] = await db
      .insert(brainNotes)
      .values({
        userId: user.id,
        slug,
        title: noteTitle,
        content: noteContent,
        tags: ['voice-note', 'audio'],
        wordCount: transcript.split(/\s+/).length,
        frontmatter: { source: 'voice_note', transcribedAt: new Date().toISOString() },
      })
      .returning({ id: brainNotes.id, slug: brainNotes.slug })

    await db.insert(agentJobs).values({
      userId: user.id,
      jobType: 'embed_note',
      agentName: 'embedder',
      payload: { noteId: note.id },
      priority: 7,
    })

    return NextResponse.json({ text: transcript, saved: true, id: note.id, slug: note.slug })
  }

  return NextResponse.json({ text: transcript })
}
