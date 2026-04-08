/**
 * Vector Store — Qdrant + Ollama nomic-embed-text-v1.5
 *
 * Architecture:
 *   - Ollama runs nomic-embed-text-v1.5 locally (768-dim, private, free)
 *   - Qdrant stores vectors with payload (noteId, userId, title, tags)
 *   - Falls back to JSONB cosine sim if Qdrant is unavailable
 *
 * Collections:
 *   - "brain_notes"  — note embeddings (768-dim)
 *   - "memories"     — Claude session memories (768-dim)
 */

import { QdrantClient } from '@qdrant/js-client-rest'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const QDRANT_URL = process.env.QDRANT_URL ?? 'http://localhost:6333'
const EMBED_MODEL = 'nomic-embed-text'
const EMBED_DIM = 768

// Collections
export const COLLECTION_NOTES = 'brain_notes'
export const COLLECTION_MEMORIES = 'memories'

let _qdrant: QdrantClient | null = null

function getQdrant(): QdrantClient {
  if (!_qdrant) {
    _qdrant = new QdrantClient({ url: QDRANT_URL })
  }
  return _qdrant
}

// ── Embedding ─────────────────────────────────────────────────────────────────

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    throw new Error(`Ollama embed failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { embedding: number[] }
  return data.embedding
}

// ── Collection Bootstrap ──────────────────────────────────────────────────────

export async function ensureCollection(name: string): Promise<void> {
  const qdrant = getQdrant()
  try {
    await qdrant.getCollection(name)
  } catch {
    await qdrant.createCollection(name, {
      vectors: { size: EMBED_DIM, distance: 'Cosine' },
      optimizers_config: { default_segment_number: 2 },
      replication_factor: 1,
    })
  }
}

// ── Upsert ────────────────────────────────────────────────────────────────────

export interface NotePoint {
  id: string        // UUID — must match brainNotes.id
  vector: number[]
  payload: {
    noteId: string
    userId: string
    title: string
    tags: string[]
    summary?: string
    updatedAt: string
  }
}

export interface MemoryPoint {
  id: string
  vector: number[]
  payload: {
    userId: string
    sessionId?: string
    type: 'fact' | 'preference' | 'reasoning' | 'project' | 'decision'
    content: string
    importance: number    // 1-10
    createdAt: string
    expiresAt?: string
  }
}

export async function upsertNote(point: NotePoint): Promise<void> {
  await ensureCollection(COLLECTION_NOTES)
  const qdrant = getQdrant()
  await qdrant.upsert(COLLECTION_NOTES, {
    wait: true,
    points: [{ id: point.id, vector: point.vector, payload: point.payload }],
  })
}

export async function upsertMemory(point: MemoryPoint): Promise<void> {
  await ensureCollection(COLLECTION_MEMORIES)
  const qdrant = getQdrant()
  await qdrant.upsert(COLLECTION_MEMORIES, {
    wait: true,
    points: [{ id: point.id, vector: point.vector, payload: point.payload }],
  })
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string
  score: number
  payload: Record<string, unknown>
}

export async function searchNotes(
  queryVector: number[],
  userId: string,
  limit = 10,
): Promise<SearchResult[]> {
  await ensureCollection(COLLECTION_NOTES)
  const qdrant = getQdrant()
  const results = await qdrant.search(COLLECTION_NOTES, {
    vector: queryVector,
    limit,
    filter: { must: [{ key: 'userId', match: { value: userId } }] },
    with_payload: true,
  })
  return results.map(r => ({
    id: String(r.id),
    score: r.score,
    payload: (r.payload ?? {}) as Record<string, unknown>,
  }))
}

export async function searchMemories(
  queryVector: number[],
  userId: string,
  limit = 20,
  minImportance = 3,
): Promise<SearchResult[]> {
  await ensureCollection(COLLECTION_MEMORIES)
  const qdrant = getQdrant()
  const results = await qdrant.search(COLLECTION_MEMORIES, {
    vector: queryVector,
    limit,
    filter: {
      must: [
        { key: 'userId', match: { value: userId } },
        { key: 'importance', range: { gte: minImportance } },
      ],
    },
    with_payload: true,
  })
  return results.map(r => ({
    id: String(r.id),
    score: r.score,
    payload: (r.payload ?? {}) as Record<string, unknown>,
  }))
}

export async function deleteNote(noteId: string): Promise<void> {
  const qdrant = getQdrant()
  try {
    await qdrant.delete(COLLECTION_NOTES, {
      wait: true,
      points: [noteId],
    })
  } catch { /* ignore if not found */ }
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function vectorHealth(): Promise<{ qdrant: boolean; ollama: boolean; model: string }> {
  let qdrantOk = false
  let ollamaOk = false

  try {
    const qdrant = getQdrant()
    await qdrant.getCollections()
    qdrantOk = true
  } catch { /* offline */ }

  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json() as { models?: { name: string }[] }
      ollamaOk = data.models?.some(m => m.name.startsWith(EMBED_MODEL)) ?? false
    }
  } catch { /* offline */ }

  return { qdrant: qdrantOk, ollama: ollamaOk, model: EMBED_MODEL }
}

export async function pullEmbedModel(): Promise<void> {
  const res = await fetch(`${OLLAMA_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: EMBED_MODEL, stream: false }),
    signal: AbortSignal.timeout(300_000), // 5 min to pull model
  })
  if (!res.ok) throw new Error(`Failed to pull ${EMBED_MODEL}: ${res.status}`)
}
