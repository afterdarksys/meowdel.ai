/**
 * Semantic Note Relationships
 *
 * GET /api/brain/related?noteId=<uuid>
 *
 * Returns the top-N most semantically similar notes to the given note
 * by computing cosine similarity between stored embeddings.
 *
 * Falls back to keyword/tag overlap when embeddings are not yet available.
 *
 * Tier: semantic_search (pro)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, brainEmbeddings } from '@/lib/db/schema'
import { eq, and, ne, inArray } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

function tagOverlapScore(tagsA: string[], tagsB: string[]): number {
  if (!tagsA.length || !tagsB.length) return 0
  const setA = new Set(tagsA.map((t) => t.toLowerCase()))
  const overlap = tagsB.filter((t) => setA.has(t.toLowerCase())).length
  return overlap / Math.max(tagsA.length, tagsB.length)
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'semantic_search')) {
    return NextResponse.json({ error: 'Semantic relationships require Pro' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8'), 20)

  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  // Fetch the target note's embedding + metadata
  const [targetNote] = await db
    .select({
      id: brainNotes.id,
      title: brainNotes.title,
      tags: brainNotes.tags,
      userId: brainNotes.userId,
    })
    .from(brainNotes)
    .where(and(eq(brainNotes.id, noteId), eq(brainNotes.isDeleted, false)))
    .limit(1)

  if (!targetNote) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  if (targetNote.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [targetEmb] = await db
    .select({ embeddingJson: brainEmbeddings.embeddingJson })
    .from(brainEmbeddings)
    .where(eq(brainEmbeddings.noteId, noteId))
    .limit(1)

  const targetVec = targetEmb ? (targetEmb.embeddingJson as number[]) : null

  // Fetch all user's other notes with their embeddings
  const otherNotes = await db
    .select({
      id: brainNotes.id,
      slug: brainNotes.slug,
      title: brainNotes.title,
      summary: brainNotes.summary,
      tags: brainNotes.tags,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(
      and(
        eq(brainNotes.userId, user.id),
        ne(brainNotes.id, noteId),
        eq(brainNotes.isDeleted, false),
        eq(brainNotes.isArchived, false)
      )
    )
    .limit(500)

  let related: { id: string; slug: string; title: string; summary: string | null; tags: string[]; updatedAt: Date; score: number; method: string }[] = []

  if (targetVec) {
    // Fetch embeddings for other notes
    const embRows = await db
      .select({ noteId: brainEmbeddings.noteId, embeddingJson: brainEmbeddings.embeddingJson })
      .from(brainEmbeddings)
      .where(inArray(brainEmbeddings.noteId, otherNotes.map((n) => n.id)))

    const embMap = new Map(embRows.map((e) => [e.noteId, e.embeddingJson as number[]]))

    related = otherNotes.map((note) => {
      const vec = embMap.get(note.id)
      const score = vec ? cosineSimilarity(targetVec, vec) : tagOverlapScore(targetNote.tags ?? [], note.tags ?? []) * 0.5
      const method = vec ? 'semantic' : 'tag_overlap'
      return { ...note, tags: note.tags ?? [], score, method }
    })
  } else {
    // No embedding yet — fall back to tag overlap
    related = otherNotes.map((note) => ({
      ...note,
      tags: note.tags ?? [],
      score: tagOverlapScore(targetNote.tags ?? [], note.tags ?? []),
      method: 'tag_overlap',
    }))
  }

  // Sort by score, return top N
  related.sort((a, b) => b.score - a.score)
  const top = related
    .filter((n) => n.score > 0.1) // filter out unrelated
    .slice(0, limit)
    .map(({ id, slug, title, summary, tags, score, method }) => ({
      id, slug, title, summary, tags,
      similarity: Math.round(score * 100) / 100,
      method,
    }))

  return NextResponse.json({ related: top, sourceNoteId: noteId })
}
