/**
 * Brain Setup — Initialize vector infrastructure
 *
 * POST /api/brain/setup
 * - Pulls nomic-embed-text from Ollama if not present
 * - Creates Qdrant collections
 * - Reports status
 *
 * Protected by WORKER_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { pullEmbedModel, ensureCollection, vectorHealth, COLLECTION_NOTES, COLLECTION_MEMORIES } from '@/lib/vector'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const WORKER_SECRET = process.env.WORKER_SECRET ?? 'dev-secret'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-worker-secret') !== WORKER_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const steps: { step: string; status: 'ok' | 'error'; detail?: string }[] = []

  // Check health first
  const health = await vectorHealth()
  steps.push({ step: 'health_check', status: 'ok', detail: JSON.stringify(health) })

  // Pull embed model if Ollama is up but model isn't present
  if (health.ollama === false) {
    try {
      await pullEmbedModel()
      steps.push({ step: 'pull_embed_model', status: 'ok', detail: 'nomic-embed-text pulled' })
    } catch (err) {
      steps.push({ step: 'pull_embed_model', status: 'error', detail: String(err) })
    }
  } else {
    steps.push({ step: 'pull_embed_model', status: 'ok', detail: 'model already present' })
  }

  // Ensure Qdrant collections exist
  for (const col of [COLLECTION_NOTES, COLLECTION_MEMORIES]) {
    try {
      await ensureCollection(col)
      steps.push({ step: `collection_${col}`, status: 'ok' })
    } catch (err) {
      steps.push({ step: `collection_${col}`, status: 'error', detail: String(err) })
    }
  }

  return NextResponse.json({ steps })
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-worker-secret') !== WORKER_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const health = await vectorHealth()
  return NextResponse.json(health)
}
