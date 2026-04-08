/**
 * GET /api/memory/context?topic=&session_id=
 *
 * Returns a structured context block for Claude session initialization.
 * This is what gets injected at the start of every Claude conversation
 * to restore continuity — who they're working with, what's in progress,
 * recent decisions, learned preferences.
 *
 * Response shape mirrors Claude's memory prompt format.
 */

import { NextRequest, NextResponse } from 'next/server'
import { embed, searchMemories, searchNotes } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const topic = searchParams.get('topic') ?? 'current work and context'

    const workerSecret = req.headers.get('x-worker-secret')
    const isWorker = workerSecret === (process.env.WORKER_SECRET ?? 'dev-secret')

    let userId: string
    let userName: string | null = null

    if (isWorker && searchParams.get('user_id')) {
      userId = searchParams.get('user_id')!
    } else {
      const user = await getSession()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
      userName = user.name ?? user.email ?? null
    }

    const topicVector = await embed(topic)

    // Fetch memories in parallel by type
    const [
      preferences,
      recentDecisions,
      activeProjects,
      relevantFacts,
      relevantNotes,
    ] = await Promise.all([
      searchMemories(topicVector, userId, 5, 5).then(r =>
        r.filter(m => (m.payload as Record<string, unknown>).type === 'preference')
      ),
      searchMemories(topicVector, userId, 5, 6).then(r =>
        r.filter(m => (m.payload as Record<string, unknown>).type === 'decision')
      ),
      searchMemories(topicVector, userId, 5, 7).then(r =>
        r.filter(m => (m.payload as Record<string, unknown>).type === 'project')
      ),
      searchMemories(topicVector, userId, 10, 4),
      searchNotes(topicVector, userId, 5),
    ])

    // Also get the 3 most recently updated notes
    const recentNotes = await db
      .select({ id: brainNotes.id, title: brainNotes.title, slug: brainNotes.slug, summary: brainNotes.summary, updatedAt: brainNotes.updatedAt })
      .from(brainNotes)
      .where(and(eq(brainNotes.userId, userId), eq(brainNotes.isDeleted, false)))
      .orderBy(desc(brainNotes.updatedAt))
      .limit(3)

    const context = {
      user: userName,
      topic,
      generatedAt: new Date().toISOString(),
      preferences: preferences.map(m => (m.payload as Record<string, unknown>).content),
      activeProjects: activeProjects.map(m => (m.payload as Record<string, unknown>).content),
      recentDecisions: recentDecisions.map(m => (m.payload as Record<string, unknown>).content),
      relevantFacts: relevantFacts.map(m => ({
        content: (m.payload as Record<string, unknown>).content,
        score: m.score,
        importance: (m.payload as Record<string, unknown>).importance,
      })),
      relevantNotes: relevantNotes.map(n => ({
        title: (n.payload as Record<string, unknown>).title,
        summary: (n.payload as Record<string, unknown>).summary,
        score: n.score,
      })),
      recentNotes: recentNotes.map(n => ({
        title: n.title,
        slug: n.slug,
        summary: n.summary,
        updatedAt: n.updatedAt,
      })),
    }

    // Also return a pre-formatted prompt block for direct injection
    const promptBlock = buildPromptBlock(context)

    return NextResponse.json({ context, promptBlock })

  } catch (err) {
    console.error('[memory/context]', err)
    return NextResponse.json({ error: 'Failed to build context' }, { status: 500 })
  }
}

function buildPromptBlock(ctx: ReturnType<typeof Object.create>): string {
  const lines: string[] = [
    `<memory_context>`,
    `User: ${ctx.user ?? 'unknown'}`,
    `Generated: ${ctx.generatedAt}`,
    `Topic: ${ctx.topic}`,
    '',
  ]

  if (ctx.preferences?.length) {
    lines.push('## Preferences & Style')
    ctx.preferences.forEach((p: string) => lines.push(`- ${p}`))
    lines.push('')
  }

  if (ctx.activeProjects?.length) {
    lines.push('## Active Projects')
    ctx.activeProjects.forEach((p: string) => lines.push(`- ${p}`))
    lines.push('')
  }

  if (ctx.recentDecisions?.length) {
    lines.push('## Recent Decisions')
    ctx.recentDecisions.forEach((d: string) => lines.push(`- ${d}`))
    lines.push('')
  }

  if (ctx.recentNotes?.length) {
    lines.push('## Recently Worked On')
    ctx.recentNotes.forEach((n: { title: string; summary?: string }) =>
      lines.push(`- **${n.title}**${n.summary ? ': ' + n.summary : ''}`)
    )
    lines.push('')
  }

  if (ctx.relevantFacts?.length) {
    lines.push('## Relevant Knowledge')
    ctx.relevantFacts.slice(0, 5).forEach((f: { content: string }) => lines.push(`- ${f.content}`))
    lines.push('')
  }

  lines.push('</memory_context>')
  return lines.join('\n')
}
