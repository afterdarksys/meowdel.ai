/**
 * GET /api/memory/identity
 *
 * Returns Claude's persistent identity context for a user:
 * who they are, what they're building, how they like to work,
 * what not to repeat, and the current state of their world.
 *
 * This is injected at the very start of every Claude session
 * so it knows exactly who it's talking to without asking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { embed, searchMemories, searchNotes } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const IDENTITY_QUERY = 'who is this person, their role, goals, work style, and current projects'

export async function GET(req: NextRequest) {
  try {
    const workerSecret = req.headers.get('x-worker-secret')
    const isWorker = workerSecret === (process.env.WORKER_SECRET ?? 'dev-secret')

    let userId: string
    let userEmail: string | null = null
    let userName: string | null = null

    if (isWorker && req.nextUrl.searchParams.get('user_id')) {
      userId = req.nextUrl.searchParams.get('user_id')!
    } else {
      const user = await getSession()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
      userEmail = user.email ?? null
      userName = user.name ?? null
    }

    const identityVector = await embed(IDENTITY_QUERY)

    const [allMemories, recentNotes, noteCount] = await Promise.all([
      // Get top memories across all types
      searchMemories(identityVector, userId, 30, 1),

      // Most recently touched notes
      db.select({
        title: brainNotes.title,
        slug: brainNotes.slug,
        summary: brainNotes.summary,
        tags: brainNotes.tags,
        updatedAt: brainNotes.updatedAt,
      })
        .from(brainNotes)
        .where(and(eq(brainNotes.userId, userId), eq(brainNotes.isDeleted, false)))
        .orderBy(desc(brainNotes.updatedAt))
        .limit(10),

      // Total note count
      db.select({ id: brainNotes.id })
        .from(brainNotes)
        .where(and(eq(brainNotes.userId, userId), eq(brainNotes.isDeleted, false)))
        .then(rows => rows.length),
    ])

    // Bucket memories by type
    const byType: Record<string, string[]> = {
      preference: [],
      project: [],
      decision: [],
      fact: [],
      reasoning: [],
    }

    for (const m of allMemories) {
      const p = m.payload as Record<string, unknown>
      const type = String(p.type ?? 'fact')
      if (byType[type]) {
        byType[type].push(String(p.content ?? ''))
      }
    }

    const identity = {
      user: { id: userId, name: userName, email: userEmail },
      brain: { noteCount, recentNotes },
      preferences: byType.preference,
      activeProjects: byType.project,
      recentDecisions: byType.decision,
      knownFacts: byType.fact,
      reasoningPatterns: byType.reasoning,
      generatedAt: new Date().toISOString(),
    }

    // Pre-formatted system prompt block
    const systemBlock = buildSystemBlock(identity)

    return NextResponse.json({ identity, systemBlock })

  } catch (err) {
    console.error('[memory/identity]', err)
    return NextResponse.json({ error: 'Failed to build identity' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSystemBlock(id: any): string {
  const lines = [
    '<persistent_memory>',
    `You are working with: ${id.user.name ?? id.user.email ?? 'an ADS developer'}`,
    `Brain size: ${id.brain.noteCount} notes`,
    '',
  ]

  if (id.preferences.length) {
    lines.push('## How they work')
    id.preferences.slice(0, 5).forEach((p: string) => lines.push(`- ${p}`))
    lines.push('')
  }

  if (id.activeProjects.length) {
    lines.push('## Active projects')
    id.activeProjects.slice(0, 5).forEach((p: string) => lines.push(`- ${p}`))
    lines.push('')
  }

  if (id.recentDecisions.length) {
    lines.push('## Recent decisions (do not reverse without asking)')
    id.recentDecisions.slice(0, 5).forEach((d: string) => lines.push(`- ${d}`))
    lines.push('')
  }

  if (id.brain.recentNotes.length) {
    lines.push('## Recently active notes')
    id.brain.recentNotes.slice(0, 5).forEach((n: { title: string; summary?: string }) =>
      lines.push(`- **${n.title}**${n.summary ? ': ' + n.summary : ''}`)
    )
    lines.push('')
  }

  lines.push('</persistent_memory>')
  return lines.join('\n')
}
