/**
 * PUT    /api/brain/alarms/[id]  — update alarm
 * DELETE /api/brain/alarms/[id]  — delete alarm
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { alarms } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { computeNextFireAt, type RepeatFrequency } from '@/lib/alarms'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [existing] = await db
    .select()
    .from(alarms)
    .where(and(eq(alarms.id, id), eq(alarms.userId, user.id)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 })

  const body = await request.json()
  const hour             = body.hour             ?? existing.hour
  const minute           = body.minute           ?? existing.minute
  const timezone         = body.timezone         ?? existing.timezone
  const label            = body.label            ?? existing.label
  const isEnabled        = body.isEnabled        ?? existing.isEnabled
  const repeatEnabled    = body.repeatEnabled    ?? existing.repeatEnabled
  const repeatFrequency  = (body.repeatFrequency ?? existing.repeatFrequency) as RepeatFrequency
  const repeatDays       = body.repeatDays       ?? existing.repeatDays ?? []
  const petId            = 'petId' in body ? body.petId : existing.petId

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return NextResponse.json({ error: 'hour must be 0–23, minute must be 0–59' }, { status: 400 })
  }

  const validFrequencies: RepeatFrequency[] = ['none', 'daily', 'weekdays', 'weekends', 'weekly', 'custom']
  if (!validFrequencies.includes(repeatFrequency)) {
    return NextResponse.json({ error: `repeatFrequency must be one of: ${validFrequencies.join(', ')}` }, { status: 400 })
  }

  const nextFireAt = isEnabled
    ? computeNextFireAt(hour, minute, timezone, repeatFrequency, repeatDays)
    : null

  const [updated] = await db
    .update(alarms)
    .set({
      label,
      hour,
      minute,
      timezone,
      isEnabled,
      repeatEnabled,
      repeatFrequency,
      repeatDays,
      petId,
      nextFireAt,
      snoozeUntil: null,  // clear any active snooze on update
      updatedAt: new Date(),
    })
    .where(and(eq(alarms.id, id), eq(alarms.userId, user.id)))
    .returning()

  return NextResponse.json({ alarm: updated })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [deleted] = await db
    .delete(alarms)
    .where(and(eq(alarms.id, id), eq(alarms.userId, user.id)))
    .returning({ id: alarms.id })

  if (!deleted) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
