/**
 * GET /api/memory/search?q=&limit=&min_importance=
 *
 * Semantic search across stored memories.
 * Returns ranked memories relevant to the query.
 */

import { NextRequest, NextResponse } from 'next/server'
import { embed, searchMemories } from '@/lib/vector'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const minImportance = parseInt(searchParams.get('min_importance') ?? '1')

    if (!query) return NextResponse.json({ error: 'q required' }, { status: 400 })

    const workerSecret = req.headers.get('x-worker-secret')
    const isWorker = workerSecret === (process.env.WORKER_SECRET ?? 'dev-secret')

    let userId: string

    if (isWorker && searchParams.get('user_id')) {
      userId = searchParams.get('user_id')!
    } else {
      const user = await getSession()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const queryVector = await embed(query)
    const results = await searchMemories(queryVector, userId, limit, minImportance)

    return NextResponse.json(results.map(r => ({
      id: r.id,
      score: r.score,
      ...r.payload,
    })))

  } catch (err) {
    console.error('[memory/search]', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
