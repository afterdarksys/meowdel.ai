import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const tag = searchParams.get('tag')

  const notes = await db
    .select({ id: brainNotes.id, slug: brainNotes.slug, title: brainNotes.title, summary: brainNotes.summary, tags: brainNotes.tags, createdAt: brainNotes.createdAt, updatedAt: brainNotes.updatedAt })
    .from(brainNotes)
    .where(eq(brainNotes.userId, user.id))
    .orderBy(desc(brainNotes.updatedAt))
    .limit(limit)

  const filtered = tag ? notes.filter(n => Array.isArray(n.tags) && (n.tags as string[]).includes(tag)) : notes
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, tags } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}`
  const [note] = await db.insert(brainNotes).values({
    userId: user.id,
    slug,
    title,
    content: content ?? '',
    tags: tags ?? [],
  }).returning({ id: brainNotes.id, slug: brainNotes.slug, title: brainNotes.title })

  return NextResponse.json(note, { status: 201 })
}
