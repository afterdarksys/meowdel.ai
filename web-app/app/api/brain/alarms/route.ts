/**
 * GET  /api/brain/alarms        — list user's alarms
 * POST /api/brain/alarms        — create alarm (max 5 per account)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { alarms } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { computeNextFireAt, type RepeatFrequency } from '@/lib/alarms'

export const dynamic = 'force-dynamic'

const MAX_ALARMS = 5

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select()
    .from(alarms)
    .where(eq(alarms.userId, user.id))
    .orderBy(alarms.createdAt)

  return NextResponse.json({ alarms: rows, max: MAX_ALARMS })
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enforce 5-alarm cap
  const [{ total }] = await db
    .select({ total: count() })
    .from(alarms)
    .where(eq(alarms.userId, user.id))

  if (total >= MAX_ALARMS) {
    return NextResponse.json(
      { error: `Alarm limit reached. Maximum ${MAX_ALARMS} alarms per account.` },
      { status: 422 }
    )
  }

  const body = await request.json()
  const { label, hour, minute, timezone = 'UTC', repeatEnabled = false, repeatFrequency = 'none', repeatDays = [], petId } = body

  if (hour == null || minute == null) {
    return NextResponse.json({ error: 'hour and minute are required' }, { status: 400 })
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return NextResponse.json({ error: 'hour must be 0–23, minute must be 0–59' }, { status: 400 })
  }

  const validFrequencies: RepeatFrequency[] = ['none', 'daily', 'weekdays', 'weekends', 'weekly', 'custom']
  if (!validFrequencies.includes(repeatFrequency)) {
    return NextResponse.json({ error: `repeatFrequency must be one of: ${validFrequencies.join(', ')}` }, { status: 400 })
  }

  const nextFireAt = computeNextFireAt(hour, minute, timezone, repeatFrequency as RepeatFrequency, repeatDays)

  const [alarm] = await db
    .insert(alarms)
    .values({
      userId: user.id,
      label: label || 'Alarm',
      hour,
      minute,
      timezone,
      isEnabled: true,
      repeatEnabled,
      repeatFrequency,
      repeatDays,
      petId: petId ?? null,
      nextFireAt,
    })
    .returning()

  return NextResponse.json({ alarm }, { status: 201 })
}
