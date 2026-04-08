/**
 * POST /api/brain/flashcards/generate
 * Body: { noteId: string }
 *
 * Uses Claude Haiku to extract Q/A pairs from a note, then inserts them
 * into brain_flashcards with default SM-2 values.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainFlashcards, brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'spaced_repetition')) {
    return NextResponse.json({ error: 'Spaced repetition requires Pro' }, { status: 403 })
  }

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  // Fetch note, verify ownership
  const [note] = await db
    .select({ id: brainNotes.id, title: brainNotes.title, content: brainNotes.content, userId: brainNotes.userId })
    .from(brainNotes)
    .where(and(eq(brainNotes.id, noteId), eq(brainNotes.isDeleted, false)))
    .limit(1)

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  if (note.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Ask Claude to extract flashcard pairs
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract 5-10 high-quality question/answer flashcard pairs from the following note. Focus on key concepts, definitions, and facts worth memorizing. Return ONLY a JSON array in this format, no other text:
[{"front": "What is X?", "back": "X is Y because Z."}]

Note title: ${note.title}
Note content:
${note.content.slice(0, 6000)}`,
      },
    ],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'

  let pairs: { front: string; back: string }[] = []
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) pairs = JSON.parse(match[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  if (!pairs.length) {
    return NextResponse.json({ error: 'No flashcard pairs could be extracted', cards: [] })
  }

  // Insert cards — SM-2 defaults: EF=2.5 (stored as 250), interval=1, reps=0
  const now = new Date()
  const inserted = await db
    .insert(brainFlashcards)
    .values(
      pairs.map((p) => ({
        userId: user.id,
        noteId: note.id,
        front: p.front,
        back: p.back,
        easinessFactor: 250,
        interval: 1,
        repetitions: 0,
        nextReviewAt: now,
      }))
    )
    .returning({ id: brainFlashcards.id })

  return NextResponse.json({ success: true, created: inserted.length, cards: inserted })
}
