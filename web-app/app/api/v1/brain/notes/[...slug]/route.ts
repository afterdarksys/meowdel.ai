import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { brainNotes, brainNoteVersions, agentJobs } from '@/lib/db/schema'
import { eq, and, max, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string[] }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug: slugParts } = await params
  const slug = slugParts.join('/')

  const [note] = await db
    .select()
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, user.id),
      eq(brainNotes.slug, slug),
      eq(brainNotes.isDeleted, false),
    ))
    .limit(1)

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  db.update(brainNotes)
    .set({ viewCount: sql`${brainNotes.viewCount} + 1` })
    .where(eq(brainNotes.id, note.id))
    .catch(() => {})

  return NextResponse.json({
    id: note.id,
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    content: note.content,
    summary: note.summary,
    wordCount: note.wordCount,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
  })
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug: slugParts } = await params
  const slug = slugParts.join('/')
  const { content, title, tags } = await req.json()

  const [existing] = await db
    .select({ id: brainNotes.id, content: brainNotes.content, title: brainNotes.title, tags: brainNotes.tags })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, user.id),
      eq(brainNotes.slug, slug),
      eq(brainNotes.isDeleted, false),
    ))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const newContent = content ?? existing.content
  const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length

  const [versionRow] = await db
    .select({ max: max(brainNoteVersions.versionNumber) })
    .from(brainNoteVersions)
    .where(eq(brainNoteVersions.noteId, existing.id))

  await db.insert(brainNoteVersions).values({
    noteId: existing.id,
    userId: user.id,
    content: existing.content,
    title: existing.title,
    tags: (existing.tags as string[]) ?? [],
    versionNumber: (versionRow?.max ?? 0) + 1,
    authorType: 'user',
    changeSummary: null,
  })

  await db.update(brainNotes)
    .set({
      content: newContent,
      title: title ?? existing.title,
      tags: tags ?? existing.tags,
      wordCount,
      updatedAt: new Date(),
    })
    .where(eq(brainNotes.id, existing.id))

  db.insert(agentJobs).values([
    { userId: user.id, jobType: 'summarize_note', agentName: 'summarizer', payload: { noteId: existing.id }, priority: 5 },
    { userId: user.id, jobType: 'embed_note', agentName: 'embedder', payload: { noteId: existing.id }, priority: 6 },
  ]).catch(() => {})

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug: slugParts } = await params
  const slug = slugParts.join('/')

  const [note] = await db
    .select({ id: brainNotes.id })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, user.id),
      eq(brainNotes.slug, slug),
      eq(brainNotes.isDeleted, false),
    ))
    .limit(1)

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  await db.update(brainNotes)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(brainNotes.id, note.id))

  return NextResponse.json({ success: true })
}
