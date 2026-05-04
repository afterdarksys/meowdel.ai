/**
 * GET /api/brain/alarms/check
 *
 * Returns alarms that are due right now for the authenticated user.
 * For each fired alarm:
 *   - Records lastFiredAt
 *   - Advances nextFireAt (or disables if repeatFrequency === 'none')
 *
 * Clients should poll this every 30s while the tab is active.
 * The response also includes the pet personality greeting so the UI
 * can show the cat's wake-up message without a second request.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { alarms } from '@/lib/db/schema'
import { and, eq, lte, or, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { computeNextFireAt, type RepeatFrequency } from '@/lib/alarms'
import { getPersonalityById } from '@/lib/personality/engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  const due = await db
    .select()
    .from(alarms)
    .where(
      and(
        eq(alarms.userId, user.id),
        eq(alarms.isEnabled, true),
        lte(alarms.nextFireAt, now),
        or(isNull(alarms.snoozeUntil), lte(alarms.snoozeUntil, now)),
      )
    )

  if (due.length === 0) {
    return NextResponse.json({ fired: [] })
  }

  // Advance each alarm and build response payload
  const fired = await Promise.all(due.map(async (alarm) => {
    const isRepeating = alarm.repeatEnabled && alarm.repeatFrequency !== 'none'

    const nextFireAt = isRepeating
      ? computeNextFireAt(
          alarm.hour,
          alarm.minute,
          alarm.timezone,
          alarm.repeatFrequency as RepeatFrequency,
          alarm.repeatDays ?? [],
          now,
        )
      : null

    await db
      .update(alarms)
      .set({
        lastFiredAt: now,
        nextFireAt,
        isEnabled: nextFireAt !== null,
        snoozeUntil: null,
        updatedAt: now,
      })
      .where(eq(alarms.id, alarm.id))

    // Get the cat's wake-up message
    const petId = alarm.petId ?? 'meowdel'
    const personality = getPersonalityById(petId)
    const catMessage = personality?.greetings.returning ?? `*purr* Time to wake up! Your alarm "${alarm.label}" is going off!`
    const photo = personality?.selectPhoto({ mood: 'playful' }) ?? null

    return {
      id: alarm.id,
      label: alarm.label,
      hour: alarm.hour,
      minute: alarm.minute,
      timezone: alarm.timezone,
      petId,
      catMessage,
      photo,
      nextFireAt,
    }
  }))

  return NextResponse.json({ fired })
}
