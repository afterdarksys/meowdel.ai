/**
 * Liveblocks Auth — Team-gated real-time collaboration
 * Liveblocks requires a server-side auth endpoint that returns a signed token
 * scoped to the specific room (note) the user is accessing.
 *
 * Tier: team
 * Docs: https://liveblocks.io/docs/authentication/access-token
 */

import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'
import { db } from '@/lib/db'
import { brainNotes, brainWorkspaceMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function getLiveblocks() {
  const key = process.env.LIVEBLOCKS_SECRET_KEY
  if (!key) throw new Error('LIVEBLOCKS_SECRET_KEY not configured')
  return new Liveblocks({ secret: key })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!can(user.subscriptionTier, 'collaboration')) {
    return NextResponse.json(
      { error: 'Real-time collaboration requires a Team plan' },
      { status: 403 }
    )
  }

  const { room } = await req.json()
  // room format: "note:{noteId}"
  if (!room || !room.startsWith('note:')) {
    return NextResponse.json({ error: 'Invalid room' }, { status: 400 })
  }

  const noteId = room.replace('note:', '')

  // Verify user has access to this note (owns it or is a workspace member)
  const [note] = await db
    .select({
      id: brainNotes.id,
      userId: brainNotes.userId,
      workspaceId: brainNotes.workspaceId,
      title: brainNotes.title,
    })
    .from(brainNotes)
    .where(and(eq(brainNotes.id, noteId), eq(brainNotes.isDeleted, false)))
    .limit(1)

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  let hasAccess = note.userId === user.id

  if (!hasAccess && note.workspaceId) {
    const [membership] = await db
      .select({ role: brainWorkspaceMembers.role })
      .from(brainWorkspaceMembers)
      .where(
        and(
          eq(brainWorkspaceMembers.workspaceId, note.workspaceId),
          eq(brainWorkspaceMembers.userId, user.id)
        )
      )
      .limit(1)

    hasAccess = !!membership
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const liveblocks = getLiveblocks()
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.name ?? user.email,
      email: user.email,
      // Color derived deterministically from user id so it's stable across sessions
      color: `hsl(${parseInt(user.id.replace(/-/g, '').slice(0, 8), 16) % 360}, 70%, 60%)`,
    },
  })

  // Grant full access to this specific room only
  session.allow(room, session.FULL_ACCESS)

  const { status, body } = await session.authorize()
  return new NextResponse(body, { status })
}
