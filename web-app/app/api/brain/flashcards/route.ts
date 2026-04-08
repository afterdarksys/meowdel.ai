/**
 * Flashcard API — generate, list, and review spaced-repetition cards.
 *
 * GET  /api/brain/flashcards          — list cards due for review today
 * GET  /api/brain/flashcards?noteId=  — list all cards for a specific note
 * POST /api/brain/flashcards/generate — generate cards from note content via AI
 * PUT  /api/brain/flashcards/review   — record a review result + update SM-2 schedule
 *
 * Tier: pro
 * SM-2 algorithm: https://www.supermemo.com/en/articles/twenty-rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainFlashcards, brainNotes } from '@/lib/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'spaced_repetition')) {
    return NextResponse.json({ error: 'Spaced repetition requires Pro' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')

  if (noteId) {
    // All cards for a specific note
    const cards = await db
      .select()
      .from(brainFlashcards)
      .where(and(eq(brainFlashcards.userId, user.id), eq(brainFlashcards.noteId, noteId)))

    return NextResponse.json({ cards })
  }

  // Cards due today
  const now = new Date()
  const cards = await db
    .select()
    .from(brainFlashcards)
    .where(
      and(
        eq(brainFlashcards.userId, user.id),
        lte(brainFlashcards.nextReviewAt, now)
      )
    )
    .limit(50)

  return NextResponse.json({ cards, dueCount: cards.length })
}
