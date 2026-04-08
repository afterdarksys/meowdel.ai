/**
 * POST /api/memory/session
 *
 * Handles session lifecycle events:
 *
 * action: "start"
 *   - Fetches identity + context for the user
 *   - Returns a systemBlock ready to inject into Claude's system prompt
 *   - Creates a session record for tracking
 *
 * action: "end"
 *   - Accepts transcript from completed session
 *   - Fires distillation to extract and store memories
 *   - Returns count of memories stored
 *
 * Body: {
 *   action: "start" | "end"
 *   sessionId: string
 *   topic?: string           — for "start", scopes context fetch
 *   transcript?: string      — for "end", raw conversation text
 *   userId?: string          — for worker-originated calls
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { embed, upsertMemory, searchMemories } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DISTILL_PROMPT = `You are a memory distillation agent. Extract the most important memories from this conversation that should persist long-term.

For each memory, output a JSON object with:
- "content": concise 1-2 sentence description (what to remember)
- "type": one of: "fact" | "preference" | "reasoning" | "project" | "decision"
- "importance": 1-10 (10 = critical, 1 = trivial)

Rules:
- Extract 3-8 memories max. Quality over quantity.
- Skip pleasantries and small talk.
- Capture: decisions made, user preferences revealed, project context, technical choices, things to NOT do again.
- Write memories as if reminding Claude in a future session.

Return a JSON array. Nothing else.

Conversation:
`

async function getAuth(req: NextRequest, body: Record<string, unknown>) {
  const workerSecret = req.headers.get('x-worker-secret')
  const isWorker = workerSecret === (process.env.WORKER_SECRET ?? 'dev-secret')

  if (isWorker && body.userId) {
    return { userId: body.userId as string, userName: null, userEmail: null }
  }

  const user = await getSession()
  if (!user) return null

  return { userId: user.id, userName: user.name ?? null, userEmail: user.email ?? null }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, sessionId, topic, transcript } = body

    if (!action || !sessionId) {
      return NextResponse.json({ error: 'action and sessionId required' }, { status: 400 })
    }

    const auth = await getAuth(req, body)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId, userName } = auth

    // ── SESSION START ──────────────────────────────────────────────────────────
    if (action === 'start') {
      const contextTopic = topic ?? 'current work and context'
      const topicVector = await embed(contextTopic)

      const [preferences, decisions, projects, recentNotes] = await Promise.all([
        searchMemories(topicVector, userId, 5, 5).then(r =>
          r.filter(m => (m.payload as Record<string, unknown>).type === 'preference')
        ),
        searchMemories(topicVector, userId, 5, 6).then(r =>
          r.filter(m => (m.payload as Record<string, unknown>).type === 'decision')
        ),
        searchMemories(topicVector, userId, 5, 7).then(r =>
          r.filter(m => (m.payload as Record<string, unknown>).type === 'project')
        ),
        db.select({ title: brainNotes.title, summary: brainNotes.summary, slug: brainNotes.slug })
          .from(brainNotes)
          .where(and(eq(brainNotes.userId, userId), eq(brainNotes.isDeleted, false)))
          .orderBy(desc(brainNotes.updatedAt))
          .limit(5),
      ])

      const extract = (arr: typeof preferences) =>
        arr.map(m => String((m.payload as Record<string, unknown>).content ?? ''))

      const systemBlock = buildStartBlock({
        userName,
        sessionId,
        topic: contextTopic,
        preferences: extract(preferences),
        decisions: extract(decisions),
        projects: extract(projects),
        recentNotes,
      })

      return NextResponse.json({ sessionId, systemBlock, action: 'start' })
    }

    // ── SESSION END ────────────────────────────────────────────────────────────
    if (action === 'end') {
      if (!transcript || typeof transcript !== 'string') {
        return NextResponse.json({ error: 'transcript required for action=end' }, { status: 400 })
      }

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: DISTILL_PROMPT + transcript.slice(0, 12000) }],
      })

      const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'

      let memories: { content: string; type: string; importance: number }[] = []
      try {
        const match = raw.match(/\[[\s\S]*\]/)
        memories = match ? JSON.parse(match[0]) : []
      } catch {
        return NextResponse.json({ error: 'Failed to parse distillation', raw }, { status: 500 })
      }

      const stored: { id: string; content: string; importance: number }[] = []

      await Promise.all(memories.map(async (m) => {
        if (!m.content || typeof m.content !== 'string') return
        try {
          const vector = await embed(m.content)
          const id = randomUUID()
          await upsertMemory({
            id,
            vector,
            payload: {
              userId,
              sessionId,
              type: m.type as 'fact' | 'preference' | 'reasoning' | 'project' | 'decision',
              content: m.content,
              importance: Math.min(10, Math.max(1, Number(m.importance) || 5)),
              createdAt: new Date().toISOString(),
            },
          })
          stored.push({ id, content: m.content, importance: m.importance })
        } catch (err) {
          console.error('[session/end] failed to store memory:', err)
        }
      }))

      return NextResponse.json({ sessionId, action: 'end', distilled: stored.length, memories: stored })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })

  } catch (err) {
    console.error('[memory/session]', err)
    return NextResponse.json({ error: 'Session operation failed' }, { status: 500 })
  }
}

function buildStartBlock(opts: {
  userName: string | null
  sessionId: string
  topic: string
  preferences: string[]
  decisions: string[]
  projects: string[]
  recentNotes: { title: string; summary?: string | null }[]
}): string {
  const lines = [
    '<persistent_memory>',
    `Session: ${opts.sessionId}`,
    `User: ${opts.userName ?? 'unknown'}`,
    `Topic: ${opts.topic}`,
    '',
  ]

  if (opts.preferences.length) {
    lines.push('## How they work')
    opts.preferences.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  if (opts.projects.length) {
    lines.push('## Active projects')
    opts.projects.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  if (opts.decisions.length) {
    lines.push('## Recent decisions (do not reverse without asking)')
    opts.decisions.forEach(d => lines.push(`- ${d}`))
    lines.push('')
  }

  if (opts.recentNotes.length) {
    lines.push('## Recently active notes')
    opts.recentNotes.forEach(n =>
      lines.push(`- **${n.title}**${n.summary ? ': ' + n.summary : ''}`)
    )
    lines.push('')
  }

  lines.push('</persistent_memory>')
  return lines.join('\n')
}
