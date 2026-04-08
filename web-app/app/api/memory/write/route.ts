/**
 * POST /api/memory/write
 *
 * Store a memory into the vector store.
 * Called by Claude agents to persist what they learn across sessions.
 *
 * Body: {
 *   content: string           — the memory text
 *   type: MemoryType          — fact | preference | reasoning | project | decision
 *   importance: number        — 1-10 (10 = never forget)
 *   sessionId?: string        — which session this came from
 *   userId?: string           — override; defaults to authenticated user
 *   expiresAt?: string        — ISO date; omit for permanent
 *   tags?: string[]           — optional categorization
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { embed, upsertMemory } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, type = 'fact', importance = 5, sessionId, expiresAt, tags } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    // Auth — allow worker secret for agent-originated writes
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

    // Generate embedding
    const vector = await embed(content)

    const id = randomUUID()
    const now = new Date().toISOString()

    await upsertMemory({
      id,
      vector,
      payload: {
        userId,
        sessionId,
        type,
        content,
        importance: Math.min(10, Math.max(1, Number(importance))),
        createdAt: now,
        expiresAt,
      },
    })

    return NextResponse.json({ id, stored: true })

  } catch (err) {
    console.error('[memory/write]', err)
    return NextResponse.json({ error: 'Failed to store memory' }, { status: 500 })
  }
}
