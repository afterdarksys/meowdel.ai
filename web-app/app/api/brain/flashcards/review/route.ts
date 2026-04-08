/**
 * PUT /api/brain/flashcards/review
 * Body: { cardId: string; quality: 0|1|2|3|4|5 }
 *
 * quality follows SM-2 convention:
 *   5 = perfect recall
 *   4 = correct with slight hesitation
 *   3 = correct with serious difficulty
 *   2 = incorrect, easy recall on seeing answer
 *   1 = incorrect, remembered on seeing answer
 *   0 = complete blackout
 *
 * Updates the card's interval, EF, repetitions, and nextReviewAt.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainFlashcards } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function sm2(
  quality: number, // 0-5
  repetitions: number,
  easinessFactor: number, // stored x100
  interval: number
): { nextRepetitions: number; nextEF: number; nextInterval: number } {
  const ef = easinessFactor / 100

  if (quality >= 3) {
    let nextInterval: number
    if (repetitions === 0) nextInterval = 1
    else if (repetitions === 1) nextInterval = 6
    else nextInterval = Math.round(interval * ef)

    const nextEF = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    return {
      nextRepetitions: repetitions + 1,
      nextEF: Math.round(nextEF * 100),
      nextInterval,
    }
  } else {
    // Failed — reset repetitions and interval
    return {
      nextRepetitions: 0,
      nextEF: easinessFactor, // EF unchanged on failure
      nextInterval: 1,
    }
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardId, quality } = await req.json()
  if (!cardId || quality === undefined) {
    return NextResponse.json({ error: 'cardId and quality required' }, { status: 400 })
  }
  if (quality < 0 || quality > 5) {
    return NextResponse.json({ error: 'quality must be 0-5' }, { status: 400 })
  }

  // Fetch card, verify ownership
  const [card] = await db
    .select()
    .from(brainFlashcards)
    .where(and(eq(brainFlashcards.id, cardId), eq(brainFlashcards.userId, user.id)))
    .limit(1)

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const { nextRepetitions, nextEF, nextInterval } = sm2(
    quality,
    card.repetitions,
    card.easinessFactor,
    card.interval
  )

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval)

  await db
    .update(brainFlashcards)
    .set({
      repetitions: nextRepetitions,
      easinessFactor: nextEF,
      interval: nextInterval,
      nextReviewAt,
      lastReviewedAt: new Date(),
    })
    .where(eq(brainFlashcards.id, card.id))

  return NextResponse.json({
    success: true,
    nextReviewAt,
    nextInterval,
    nextEF: nextEF / 100,
  })
}
