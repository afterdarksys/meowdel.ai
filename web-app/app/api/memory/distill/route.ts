/**
 * POST /api/memory/distill
 *
 * Takes a raw conversation transcript and uses Claude to extract
 * structured memories worth persisting permanently.
 *
 * Called at session end, or whenever there's a chunk of conversation
 * worth distilling into long-term memory.
 *
 * Body: {
 *   transcript: string       — raw conversation text
 *   sessionId?: string
 *   userId?: string          — for worker-originated calls
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { embed, upsertMemory } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
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

interface RawMemory {
  content: string
  type: string
  importance: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transcript, sessionId } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'transcript required' }, { status: 400 })
    }

    const workerSecret = req.headers.get('x-worker-secret')
    const isWorker = workerSecret === (process.env.WORKER_SECRET ?? 'dev-secret')

    let userId: string

    if (isWorker && body.userId) {
      userId = body.userId
    } else {
      const user = await getSession()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    // Use Claude Haiku for distillation (fast + cheap)
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: DISTILL_PROMPT + transcript.slice(0, 12000),
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'

    let memories: RawMemory[] = []
    try {
      const match = raw.match(/\[[\s\S]*\]/)
      memories = match ? JSON.parse(match[0]) : []
    } catch {
      return NextResponse.json({ error: 'Failed to parse distillation', raw }, { status: 500 })
    }

    // Store each memory in Qdrant
    const stored: { id: string; content: string; importance: number }[] = []

    await Promise.all(memories.map(async (m) => {
      if (!m.content || typeof m.content !== 'string') return

      try {
        const vector = await embed(m.content)
        const id = randomUUID()
        const now = new Date().toISOString()

        await upsertMemory({
          id,
          vector,
          payload: {
            userId,
            sessionId,
            type: m.type as 'fact' | 'preference' | 'reasoning' | 'project' | 'decision',
            content: m.content,
            importance: Math.min(10, Math.max(1, Number(m.importance) || 5)),
            createdAt: now,
          },
        })

        stored.push({ id, content: m.content, importance: m.importance })
      } catch (err) {
        console.error('[distill] failed to store memory:', err)
      }
    }))

    return NextResponse.json({ distilled: stored.length, memories: stored })

  } catch (err) {
    console.error('[memory/distill]', err)
    return NextResponse.json({ error: 'Distillation failed' }, { status: 500 })
  }
}
