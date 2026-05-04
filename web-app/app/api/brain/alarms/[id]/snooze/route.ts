/**
 * PATCH /api/brain/alarms/[id]/snooze
 *
 * Snooze a fired alarm. Body: { minutes?: number }  (default 9 minutes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { alarms } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

const DEFAULT_SNOOZE_MINUTES = 9

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const minutes = Math.min(Math.max(1, body.minutes ?? DEFAULT_SNOOZE_MINUTES), 60)

  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000)

  const [updated] = await db
    .update(alarms)
    .set({ snoozeUntil, updatedAt: new Date() })
    .where(and(eq(alarms.id, id), eq(alarms.userId, user.id)))
    .returning({ id: alarms.id, snoozeUntil: alarms.snoozeUntil })

  if (!updated) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 })

  return NextResponse.json({ success: true, snoozeUntil: updated.snoozeUntil, snoozedMinutes: minutes })
}
