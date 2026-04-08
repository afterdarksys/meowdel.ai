import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, brainNoteVersions, agentJobs } from '@/lib/db/schema'
import { eq, and, max, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

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

  // Increment view count (fire-and-forget)
  db.update(brainNotes)
    .set({ viewCount: sql`${brainNotes.viewCount} + 1` })
    .where(eq(brainNotes.id, note.id))
    .catch(console.error)

  return NextResponse.json({
    id: note.id,
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    content: note.content,
    summary: note.summary,
    frontmatter: note.frontmatter,
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

  const wordCount = (content ?? existing.content).trim().split(/\s+/).filter(Boolean).length

  // Save version before overwriting
  const [versionRow] = await db
    .select({ max: max(brainNoteVersions.versionNumber) })
    .from(brainNoteVersions)
    .where(eq(brainNoteVersions.noteId, existing.id))

  const nextVersion = (versionRow?.max ?? 0) + 1

  await db.insert(brainNoteVersions).values({
    noteId: existing.id,
    userId: user.id,
    content: existing.content,
    title: existing.title,
    tags: existing.tags ?? [],
    versionNumber: nextVersion,
    authorType: 'user',
    changeSummary: null,
  })

  await db
    .update(brainNotes)
    .set({
      content: content ?? existing.content,
      title: title ?? existing.title,
      tags: tags ?? existing.tags,
      wordCount,
      updatedAt: new Date(),
    })
    .where(eq(brainNotes.id, existing.id))

  // Queue re-embed + summarize jobs
  db.insert(agentJobs).values([
    { userId: user.id, jobType: 'summarize_note', agentName: 'summarizer', payload: { noteId: existing.id }, priority: 5 },
    { userId: user.id, jobType: 'embed_note', agentName: 'embedder', payload: { noteId: existing.id }, priority: 6 },
  ]).catch(console.error)

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

  // Soft delete
  await db
    .update(brainNotes)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(brainNotes.id, note.id))

  return NextResponse.json({ success: true })
}
