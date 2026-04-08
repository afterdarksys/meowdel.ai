/**
 * POST /api/brain/swarm
 *
 * Ruflo-style swarm orchestration endpoint.
 * Dispatches tasks to specialized agents via the Queen orchestrator.
 *
 * Body: {
 *   mode: "analyze" | "organize" | "synthesize" | "deep_dive" | "auto"
 *   input: string          — the task or question
 *   context?: string       — additional context (note content, etc.)
 *   noteId?: string        — optional note to focus on
 *   sessionId?: string     — for memory attribution
 *   async?: boolean        — if true, enqueue as agent job and return immediately
 * }
 *
 * Modes:
 *   analyze    → Researcher + Challenger (find connections + stress-test)
 *   organize   → Librarian + Curator (tag + hygiene)
 *   synthesize → Researcher + Synthesizer (find + merge)
 *   deep_dive  → All 5 agents sequentially
 *   auto       → Queen decides which agents to use
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSwarm, SwarmMode } from '@/lib/swarm/queen'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { agentJobs } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VALID_MODES: SwarmMode[] = ['analyze', 'organize', 'synthesize', 'deep_dive', 'auto']

const WORKER_SECRET = process.env.WORKER_SECRET ?? 'dev-secret'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode = 'auto', input, context, noteId, sessionId, async: isAsync = false } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'input required' }, { status: 400 })
    }

    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` }, { status: 400 })
    }

    // Auth — workers can pass userId directly
    const workerSecret = req.headers.get('x-worker-secret')
    const isWorker = workerSecret === WORKER_SECRET

    let userId: string

    if (isWorker && body.userId) {
      userId = body.userId
    } else {
      const user = await getSession()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    // Async mode — enqueue as agent job, return immediately
    if (isAsync) {
      const [job] = await db.insert(agentJobs).values({
        userId,
        jobType: `swarm_${mode}`,
        agentName: 'queen',
        payload: { mode, input, context, noteId, sessionId },
        priority: mode === 'deep_dive' ? 3 : 5,
      }).returning({ id: agentJobs.id })

      return NextResponse.json({ queued: true, jobId: job.id, mode })
    }

    // Sync mode — run now, wait for result
    const result = await runSwarm({
      mode,
      userId,
      input,
      context,
      noteId,
      sessionId,
    })

    return NextResponse.json(result)

  } catch (err) {
    console.error('[swarm]', err)
    return NextResponse.json({ error: 'Swarm failed', detail: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Returns swarm capabilities and agent descriptions
  return NextResponse.json({
    agents: {
      librarian: 'Organizes, tags, and categorizes knowledge. Suggests wikilinks and metadata.',
      researcher: 'Finds connections and surfaces relevant context from your knowledge base.',
      synthesizer: 'Creates higher-order understanding by merging and distilling knowledge.',
      challenger: 'Stress-tests ideas, finds contradictions, surfaces unexamined assumptions.',
      curator: 'Memory hygiene — deduplicates, rates importance, expires stale knowledge.',
    },
    modes: {
      analyze: 'Researcher + Challenger',
      organize: 'Librarian + Curator',
      synthesize: 'Researcher + Synthesizer',
      deep_dive: 'All 5 agents (sequential)',
      auto: 'Queen decides based on your task',
    },
  })
}
