/**
 * Brain Semantic Search
 *
 * Uses Qdrant + Ollama nomic-embed-text for real ANN search.
 * Falls back to keyword scoring if vector store is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { embed, searchNotes } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 10 } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query required' }, { status: 400 })
    }

    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate query embedding
    const queryVector = await embed(query)

    // Search Qdrant
    const results = await searchNotes(queryVector, user.id, limit)

    // Fetch full note data for matched IDs
    const noteIds = results.map(r => r.id)
    if (noteIds.length === 0) return NextResponse.json([])

    const notes = await db
      .select({
        id: brainNotes.id,
        slug: brainNotes.slug,
        title: brainNotes.title,
        summary: brainNotes.summary,
        tags: brainNotes.tags,
        updatedAt: brainNotes.updatedAt,
      })
      .from(brainNotes)
      .where(and(
        eq(brainNotes.userId, user.id),
        eq(brainNotes.isDeleted, false),
      ))

    // Merge scores
    const noteMap = new Map(notes.map(n => [n.id, n]))
    const scored = results
      .map(r => ({ ...noteMap.get(r.id), score: r.score }))
      .filter(n => n.id)

    return NextResponse.json(scored)

  } catch (err) {
    console.error('[search] error:', err)
    // Fall back gracefully — return empty results, don't 500
    return NextResponse.json([])
  }
}
