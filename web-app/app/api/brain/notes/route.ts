import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// Returned by the list endpoint (no content for performance)
export interface BrainNote {
  id: string
  slug: string
  title: string
  tags: string[]
  summary: string | null
  wordCount: number
  updatedAt: Date
}

// Returned by the individual note GET endpoint (includes full content)
export interface FullBrainNote extends BrainNote {
  content: string
  frontmatter: Record<string, unknown> | null
  createdAt: Date
}

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await db
    .select({
      id: brainNotes.id,
      slug: brainNotes.slug,
      title: brainNotes.title,
      tags: brainNotes.tags,
      summary: brainNotes.summary,
      wordCount: brainNotes.wordCount,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, user.id),
      eq(brainNotes.isDeleted, false),
      eq(brainNotes.isArchived, false),
    ))
    .orderBy(desc(brainNotes.updatedAt))
    .limit(500)

  return NextResponse.json(notes)
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, slug: requestedSlug, content, tags, template } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const slug = requestedSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const body = content || `\n# ${title}\n`
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length

  try {
    const [note] = await db
      .insert(brainNotes)
      .values({
        userId: user.id,
        slug,
        title,
        content: body,
        tags: tags || [],
        wordCount,
        frontmatter: { title, tags: tags || [], created: new Date().toISOString() },
      })
      .onConflictDoNothing()
      .returning({ id: brainNotes.id, slug: brainNotes.slug })

    if (!note) {
      return NextResponse.json({ error: 'Note with this slug already exists' }, { status: 409 })
    }

    // Queue AI jobs for this note (non-blocking)
    queueNoteJobs(user.id, note.id, body).catch(console.error)

    return NextResponse.json({ success: true, id: note.id, slug: note.slug })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

// Queue background AI jobs (summarize + embed) after note creation
async function queueNoteJobs(userId: string, noteId: string, content: string) {
  const { agentJobs } = await import('@/lib/db/schema')
  await db.insert(agentJobs).values([
    {
      userId,
      jobType: 'summarize_note',
      agentName: 'summarizer',
      payload: { noteId, contentLength: content.length },
      priority: 5,
    },
    {
      userId,
      jobType: 'embed_note',
      agentName: 'embedder',
      payload: { noteId },
      priority: 6,
    },
  ])
}
