/**
 * POST /api/memory/reflect
 *
 * Deep reflection — Claude Sonnet reviews a user's full memory corpus,
 * identifies gaps, contradictions, and generates synthesis memories.
 *
 * This is the "sleep cycle" — run periodically or on-demand to consolidate
 * what's been learned into higher-order patterns and insights.
 *
 * Body: {
 *   userId?: string    — worker-originated calls
 *   maxMemories?: number  — cap at N memories to analyze (default: 50)
 * }
 *
 * Returns: {
 *   synthesized: number
 *   contradictions: number
 *   memories: [{id, content, importance}]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { embed, upsertMemory, searchMemories } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const REFLECT_PROMPT = `You are a memory consolidation agent. You have been given a user's full memory corpus from their AI assistant interactions.

Your job:
1. Find CONTRADICTIONS — memories that conflict with each other
2. Find GAPS — important patterns implied by the memories but never stated explicitly
3. Synthesize HIGH-VALUE INSIGHTS — what do these memories reveal about this person that should be remembered?

Output a JSON object with exactly these keys:
{
  "contradictions": [
    { "content": "Memory A says X but Memory B says Y — resolve: [preferred truth]", "type": "reasoning", "importance": 7 }
  ],
  "synthesized": [
    { "content": "Synthesis of pattern observed across multiple memories", "type": "reasoning"|"preference"|"fact"|"project"|"decision", "importance": 8 }
  ]
}

Rules:
- Maximum 3 contradictions, 5 synthesized memories
- Only generate memories with importance >= 6
- Write them as actionable reminders for a future AI session
- Return ONLY valid JSON, nothing else

Memory corpus:
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const maxMemories = Math.min(body.maxMemories ?? 50, 100)

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

    // Fetch the user's full memory corpus with a broad semantic sweep
    const broadVector = await embed('work preferences projects decisions facts about this person')
    const allMemories = await searchMemories(broadVector, userId, maxMemories, 1)

    if (allMemories.length < 5) {
      return NextResponse.json({
        message: 'Not enough memories to reflect on yet (need 5+)',
        count: allMemories.length,
        synthesized: 0,
        contradictions: 0,
      })
    }

    // Format the corpus for Claude
    const corpus = allMemories.map((m, i) => {
      const p = m.payload as Record<string, unknown>
      return `[${i + 1}] (${p.type}, importance=${p.importance}) ${p.content}`
    }).join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: REFLECT_PROMPT + corpus }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'

    let result: {
      contradictions?: { content: string; type: string; importance: number }[]
      synthesized?: { content: string; type: string; importance: number }[]
    } = {}

    try {
      const match = raw.match(/\{[\s\S]*\}/)
      result = match ? JSON.parse(match[0]) : {}
    } catch {
      return NextResponse.json({ error: 'Failed to parse reflection', raw }, { status: 500 })
    }

    const sessionId = `reflect-${new Date().toISOString()}`
    const stored: { id: string; content: string; importance: number; category: string }[] = []

    const storeMemories = async (
      list: { content: string; type: string; importance: number }[] | undefined,
      category: string,
    ) => {
      if (!list?.length) return
      await Promise.all(list.map(async (m) => {
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
              importance: Math.min(10, Math.max(1, Number(m.importance) || 7)),
              createdAt: new Date().toISOString(),
            },
          })
          stored.push({ id, content: m.content, importance: m.importance, category })
        } catch (err) {
          console.error('[reflect] failed to store memory:', err)
        }
      }))
    }

    await Promise.all([
      storeMemories(result.contradictions, 'contradiction'),
      storeMemories(result.synthesized, 'synthesized'),
    ])

    return NextResponse.json({
      synthesized: stored.filter(m => m.category === 'synthesized').length,
      contradictions: stored.filter(m => m.category === 'contradiction').length,
      memoriesAnalyzed: allMemories.length,
      memories: stored,
    })

  } catch (err) {
    console.error('[memory/reflect]', err)
    return NextResponse.json({ error: 'Reflection failed' }, { status: 500 })
  }
}
