/**
 * Obsidian Vault / Markdown Import
 *
 * POST /api/brain/import
 * FormData:
 *   file     — .md file or .zip (Obsidian vault export)
 *   source   — 'obsidian' | 'markdown' | 'roam' (optional label)
 *
 * Replaces the old filesystem-based import with proper DB storage.
 *
 * Tier: single .md = free; zip vault = pro (obsidian_import)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'
import matter from 'gray-matter'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

function extractTitle(content: string, filename: string): string {
  // Try frontmatter title first
  const h1 = content.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  return filename.replace(/\.md$/i, '').replace(/-/g, ' ').replace(/_/g, ' ')
}

interface ParsedNote {
  filename: string
  title: string
  content: string
  tags: string[]
  frontmatter: Record<string, unknown>
}

async function parseMdBuffer(buffer: Buffer, filename: string): Promise<ParsedNote> {
  const raw = buffer.toString('utf8')
  let parsed: { data: Record<string, unknown>; content: string }
  try {
    parsed = matter(raw)
  } catch {
    parsed = { data: {}, content: raw }
  }

  const title =
    typeof parsed.data.title === 'string'
      ? parsed.data.title
      : extractTitle(parsed.content, filename)

  const tags = Array.isArray(parsed.data.tags)
    ? (parsed.data.tags as string[]).filter((t) => typeof t === 'string')
    : []

  return {
    filename,
    title,
    content: parsed.content.trim(),
    tags,
    frontmatter: parsed.data,
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const source = (formData.get('source') as string) ?? 'markdown'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name

  const isZip = filename.endsWith('.zip')
  const isMd = filename.endsWith('.md') || filename.endsWith('.txt')

  if (!isZip && !isMd) {
    return NextResponse.json(
      { error: 'Only .md or .zip files are supported' },
      { status: 415 }
    )
  }

  if (isZip && !can(user.subscriptionTier, 'obsidian_import')) {
    return NextResponse.json(
      { error: 'Vault (zip) import requires a Pro subscription' },
      { status: 403 }
    )
  }

  const notesToImport: ParsedNote[] = []

  if (isMd) {
    notesToImport.push(await parseMdBuffer(buffer, filename))
  } else {
    // ZIP — extract all .md files
    const { Open } = await import('unzipper')
    const directory = await Open.buffer(buffer)

    for (const entry of directory.files) {
      if (entry.type === 'Directory') continue
      if (!entry.path.match(/\.(md|txt)$/i)) continue
      // Skip hidden files and Obsidian config files
      if (entry.path.includes('/.obsidian/') || entry.path.startsWith('.')) continue

      try {
        const content = await entry.buffer()
        const baseName = entry.path.split('/').pop() ?? entry.path
        notesToImport.push(await parseMdBuffer(content, baseName))
      } catch {
        // Skip unparseable files
      }
    }
  }

  if (notesToImport.length === 0) {
    return NextResponse.json({ error: 'No markdown files found in upload' }, { status: 422 })
  }

  // Import in batches to avoid DB overload
  const BATCH = 20
  const results: { slug: string; title: string; skipped?: boolean }[] = []
  const jobValues: (typeof agentJobs.$inferInsert)[] = []

  for (let i = 0; i < notesToImport.length; i += BATCH) {
    const batch = notesToImport.slice(i, i + BATCH)

    await Promise.allSettled(
      batch.map(async (n) => {
        const baseSlug = slugify(n.title) || slugify(n.filename)
        const slug = baseSlug + '-' + Date.now().toString(36) + i

        const wordCount = n.content.trim().split(/\s+/).filter(Boolean).length

        try {
          const [inserted] = await db
            .insert(brainNotes)
            .values({
              userId: user.id,
              slug,
              title: n.title,
              content: n.content,
              tags: n.tags,
              wordCount,
              frontmatter: { ...n.frontmatter, source, importedAt: new Date().toISOString() },
            })
            .onConflictDoNothing()
            .returning({ id: brainNotes.id, slug: brainNotes.slug })

          if (inserted) {
            results.push({ slug: inserted.slug, title: n.title })
            jobValues.push(
              {
                userId: user.id,
                jobType: 'embed_note',
                agentName: 'embedder',
                payload: { noteId: inserted.id },
                priority: 8,
              }
            )
          } else {
            results.push({ slug, title: n.title, skipped: true })
          }
        } catch (err) {
          console.error(`Failed to import note "${n.title}":`, err)
        }
      })
    )
  }

  // Queue embedding jobs in one insert
  if (jobValues.length > 0) {
    await db.insert(agentJobs).values(jobValues).onConflictDoNothing()
  }

  const imported = results.filter((r) => !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    total: notesToImport.length,
    notes: results.slice(0, 20), // Return first 20 for display
  })
}
