/**
 * Meowdel Cascade Memory
 *
 * Cross-tier memory system. Higher-tier insights persist and feed
 * into lower-tier sessions — Meowdel accumulates intelligence over time.
 *
 * Flow:
 *   Opus response  → stores high-importance memories (tier: 'opus')
 *   Sonnet reads   → retrieves Opus memories as context
 *   Sonnet response → stores medium memories (tier: 'sonnet')
 *   Haiku reads    → retrieves Sonnet memories (condensed)
 *   Haiku response → stores low-importance memories (tier: 'haiku')
 *
 * All stored in the existing Qdrant 'memories' collection with
 * an added 'tier' field in the payload.
 */

import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import {
  embed,
  upsertMemory,
  searchMemories,
  ensureCollection,
  COLLECTION_MEMORIES,
  MemoryPoint,
} from '@/lib/vector'
import { ModelTier } from './router'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Which memories each tier reads from (always reads from tiers ABOVE itself)
const READABLE_TIERS: Record<ModelTier, ModelTier[]> = {
  opus:   [],                         // Opus reads from nothing — it's authoritative
  sonnet: ['opus'],                   // Sonnet reads Opus insights
  haiku:  ['sonnet', 'opus'],         // Haiku reads both (gets distilled versions)
}

// Importance floors per tier — Haiku only sees high-importance memories
const MIN_IMPORTANCE: Record<ModelTier, number> = {
  opus:   1,   // Opus reads everything it stored (unused — Opus doesn't read cascade)
  sonnet: 5,   // Sonnet gets Opus memories with importance >= 5
  haiku:  7,   // Haiku only gets very high-importance cascade memories
}

// How many cascade memories to inject per tier
const CONTEXT_LIMIT: Record<ModelTier, number> = {
  opus:   0,   // Opus gets no injected cascade (it's the source of truth)
  sonnet: 5,
  haiku:  3,
}

// ── Read cascade context ──────────────────────────────────────────────────────

export interface CascadeContext {
  memories: Array<{ tier: ModelTier; content: string; importance: number; type: string }>
  formatted: string   // ready to inject into system prompt
}

export async function readCascadeContext(
  userId: string,
  tier: ModelTier,
  queryText: string,
): Promise<CascadeContext> {
  const sourceTiers = READABLE_TIERS[tier]
  if (sourceTiers.length === 0 || CONTEXT_LIMIT[tier] === 0) {
    return { memories: [], formatted: '' }
  }

  try {
    const queryVec = await embed(queryText)
    await ensureCollection(COLLECTION_MEMORIES)

    const results = await searchMemories(queryVec, userId, CONTEXT_LIMIT[tier] * 3, MIN_IMPORTANCE[tier])

    // Filter to only the readable tiers
    const filtered = results
      .filter(r => sourceTiers.includes((r.payload.tier as ModelTier) ?? 'sonnet'))
      .slice(0, CONTEXT_LIMIT[tier])

    if (filtered.length === 0) return { memories: [], formatted: '' }

    const memories = filtered.map(r => ({
      tier: (r.payload.tier as ModelTier) ?? 'sonnet',
      content: String(r.payload.content ?? ''),
      importance: Number(r.payload.importance ?? 5),
      type: String(r.payload.type ?? 'fact'),
    }))

    const lines = memories.map(m => `[${m.tier.toUpperCase()} ${m.type}] ${m.content}`)
    const formatted = `<cascade_memory>\n${lines.join('\n')}\n</cascade_memory>`

    return { memories, formatted }
  } catch {
    return { memories: [], formatted: '' }
  }
}

// ── Write cascade memories ────────────────────────────────────────────────────

interface ExchangeToStore {
  userId: string
  tier: ModelTier
  sessionId?: string
  userMessage: string
  assistantResponse: string
  saveToCascade: boolean   // explicit #save flag
}

export async function writeCascadeMemory(exchange: ExchangeToStore): Promise<void> {
  // Only Opus always writes; Sonnet writes on #save or for significant responses;
  // Haiku only writes on explicit #save
  const shouldAutoSave =
    exchange.tier === 'opus' ||
    (exchange.tier === 'sonnet' && exchange.assistantResponse.length > 400)

  if (!shouldAutoSave && !exchange.saveToCascade) return

  try {
    const summary = await summarizeExchange(exchange)
    if (!summary) return

    const { importance, type, content } = summary
    const vector = await embed(content)

    const point: MemoryPoint & { payload: { tier: ModelTier } } = {
      id: randomUUID(),
      vector,
      payload: {
        userId: exchange.userId,
        sessionId: exchange.sessionId,
        tier: exchange.tier,
        type,
        content,
        importance,
        createdAt: new Date().toISOString(),
      },
    }

    // MemoryPoint type doesn't include tier yet — we extend at runtime (Qdrant accepts extra fields)
    await upsertMemory(point as unknown as MemoryPoint)
  } catch (err) {
    console.error('[cascade] Failed to write memory:', err)
  }
}

// Use the cheapest model to summarize (saves cost)
async function summarizeExchange(exchange: ExchangeToStore): Promise<{
  content: string
  importance: number
  type: MemoryPoint['payload']['type']
} | null> {
  const prompt = `Summarize this AI exchange as a single memory entry. Extract the key insight, decision, or fact that would be useful context in future conversations.

User: ${exchange.userMessage.slice(0, 500)}
Assistant: ${exchange.assistantResponse.slice(0, 800)}

Respond with JSON only:
{
  "content": "one sentence summary of the key insight or decision",
  "importance": <1-10, where 10 is most important>,
  "type": "<fact|preference|reasoning|project|decision>"
}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // Always use Haiku for summarization — cheap
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const json = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] ?? '{}')

    if (!json.content) return null

    // Opus memories get importance boosted (they're authoritative)
    const boostedImportance = exchange.tier === 'opus'
      ? Math.min(10, (json.importance ?? 5) + 2)
      : json.importance ?? 5

    return {
      content: `[${exchange.tier.toUpperCase()}] ${json.content}`,
      importance: boostedImportance,
      type: json.type ?? 'fact',
    }
  } catch {
    return null
  }
}

// ── Cascade stats (for CLI / UI display) ─────────────────────────────────────

export async function getCascadeStats(userId: string): Promise<{
  opusMemories: number
  sonnetMemories: number
  haikuMemories: number
}> {
  try {
    const { QdrantClient } = await import('@qdrant/js-client-rest')
    const qdrant = new QdrantClient({ url: process.env.QDRANT_URL ?? 'http://localhost:6333' })

    const countForTier = async (tier: ModelTier) => {
      try {
        const r = await qdrant.count(COLLECTION_MEMORIES, {
          filter: {
            must: [
              { key: 'userId', match: { value: userId } },
              { key: 'tier', match: { value: tier } },
            ],
          },
        })
        return r.count
      } catch { return 0 }
    }

    const [opusMemories, sonnetMemories, haikuMemories] = await Promise.all([
      countForTier('opus'),
      countForTier('sonnet'),
      countForTier('haiku'),
    ])

    return { opusMemories, sonnetMemories, haikuMemories }
  } catch {
    return { opusMemories: 0, sonnetMemories: 0, haikuMemories: 0 }
  }
}
