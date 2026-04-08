import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agentJobs, brainNotes } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobs = await db
    .select()
    .from(agentJobs)
    .where(eq(agentJobs.userId, user.id))
    .orderBy(desc(agentJobs.createdAt))
    .limit(50)

  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobType, noteId, payload } = await req.json()

  if (!jobType) return NextResponse.json({ error: 'jobType required' }, { status: 400 })

  // Verify the note belongs to this user (if noteId provided)
  if (noteId) {
    const [note] = await db
      .select({ id: brainNotes.id })
      .from(brainNotes)
      .where(and(eq(brainNotes.id, noteId), eq(brainNotes.userId, user.id)))
      .limit(1)

    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  const [job] = await db
    .insert(agentJobs)
    .values({
      userId: user.id,
      jobType,
      payload: payload ?? (noteId ? { noteId } : {}),
      priority: 5,
    })
    .returning({ id: agentJobs.id, status: agentJobs.status })

  return NextResponse.json({ success: true, jobId: job.id, status: job.status })
}
