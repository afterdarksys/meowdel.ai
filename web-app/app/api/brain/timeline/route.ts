/**
 * Timeline API — chronological note history for the timeline visualization.
 *
 * GET /api/brain/timeline?limit=100&before=<iso-date>
 *
 * Returns notes grouped by month for the timeline view.
 * Tier: free
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and, lt, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)
  const before = searchParams.get('before')

  let query = db
    .select({
      id: brainNotes.id,
      slug: brainNotes.slug,
      title: brainNotes.title,
      summary: brainNotes.summary,
      tags: brainNotes.tags,
      wordCount: brainNotes.wordCount,
      createdAt: brainNotes.createdAt,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(
      and(
        eq(brainNotes.userId, user.id),
        eq(brainNotes.isDeleted, false),
        eq(brainNotes.isArchived, false),
        ...(before ? [lt(brainNotes.createdAt, new Date(before))] : [])
      )
    )
    .orderBy(desc(brainNotes.createdAt))
    .limit(limit)

  const notes = await query

  // Group by YYYY-MM for the timeline
  const grouped: Record<string, typeof notes> = {}
  for (const note of notes) {
    const key = note.createdAt.toISOString().slice(0, 7) // "2025-04"
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(note)
  }

  const months = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, monthNotes]) => ({
      month, // "2025-04"
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notes: monthNotes,
      count: monthNotes.length,
      totalWords: monthNotes.reduce((s, n) => s + (n.wordCount ?? 0), 0),
    }))

  return NextResponse.json({ months, total: notes.length })
}
