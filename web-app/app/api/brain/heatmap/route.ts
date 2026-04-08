/**
 * Knowledge Heatmap
 *
 * GET /api/brain/heatmap?year=2025
 *
 * Returns daily note creation/edit counts for the requested year,
 * in the same format used by GitHub contribution graphs.
 *
 * Response: { days: { date: "2025-01-15", count: 3 }[], max: 10 }
 *
 * Tier: free
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, brainNoteVersions } from '@/lib/db/schema'
import { eq, and, gte, lt, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  if (isNaN(year) || year < 2020 || year > 2030) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const start = new Date(`${year}-01-01T00:00:00Z`)
  const end = new Date(`${year + 1}-01-01T00:00:00Z`)

  // Count note creations per day
  const creationRows = await db
    .select({
      date: sql<string>`DATE(${brainNotes.createdAt} AT TIME ZONE 'UTC')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(brainNotes)
    .where(
      and(
        eq(brainNotes.userId, user.id),
        eq(brainNotes.isDeleted, false),
        gte(brainNotes.createdAt, start),
        lt(brainNotes.createdAt, end)
      )
    )
    .groupBy(sql`DATE(${brainNotes.createdAt} AT TIME ZONE 'UTC')`)

  // Count note edits (versions) per day
  const editRows = await db
    .select({
      date: sql<string>`DATE(${brainNoteVersions.createdAt} AT TIME ZONE 'UTC')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(brainNoteVersions)
    .where(
      and(
        eq(brainNoteVersions.userId, user.id),
        gte(brainNoteVersions.createdAt, start),
        lt(brainNoteVersions.createdAt, end)
      )
    )
    .groupBy(sql`DATE(${brainNoteVersions.createdAt} AT TIME ZONE 'UTC')`)

  // Merge counts by date
  const countMap = new Map<string, number>()

  for (const row of creationRows) {
    countMap.set(row.date, (countMap.get(row.date) ?? 0) + row.count)
  }
  for (const row of editRows) {
    countMap.set(row.date, (countMap.get(row.date) ?? 0) + row.count)
  }

  // Build full year grid (365/366 days)
  const days: { date: string; count: number }[] = []
  const cursor = new Date(start)
  while (cursor < end) {
    const dateStr = cursor.toISOString().slice(0, 10)
    days.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  const max = Math.max(...days.map((d) => d.count), 1)
  const totalActivity = days.reduce((sum, d) => sum + d.count, 0)
  const activeDays = days.filter((d) => d.count > 0).length

  return NextResponse.json({ days, max, year, totalActivity, activeDays })
}
