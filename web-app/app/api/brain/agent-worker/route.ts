/**
 * Brain Agent Worker — Ruflo Job Processor
 *
 * This route is called by a cron job (or Next.js cron route) to process
 * pending agent jobs from the agent_jobs table.
 *
 * Each job type maps to a Ruflo agent specialization. For now we call
 * Claude directly for the AI work; Ruflo MCP integration is wired in below
 * and activated when RUFLO_MCP_URL is set in env.
 *
 * Cron: hit POST /api/brain/agent-worker every 30 seconds from your scheduler.
 * In production, use Vercel Cron or a simple external ping service.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agentJobs, brainNotes, brainEmbeddings, rssFeeds } from '@/lib/db/schema'
import { eq, and, lte, asc } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { embed, upsertNote, deleteNote } from '@/lib/vector'
import { runSwarm, SwarmMode } from '@/lib/swarm/queen'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds

const WORKER_SECRET = process.env.WORKER_SECRET ?? 'dev-secret'
const BATCH_SIZE = 5

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Job Handlers ─────────────────────────────────────────────────────────────

async function handleSummarizeNote(payload: { noteId: string }) {
  const [note] = await db
    .select({ id: brainNotes.id, title: brainNotes.title, content: brainNotes.content })
    .from(brainNotes)
    .where(eq(brainNotes.id, payload.noteId))
    .limit(1)

  if (!note) throw new Error(`Note ${payload.noteId} not found`)

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Summarize this note in 2-3 sentences. Be concise. Return only the summary.\n\nTitle: ${note.title}\n\n${note.content.slice(0, 4000)}`,
    }],
  })

  const summary = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

  await db.update(brainNotes)
    .set({ summary })
    .where(eq(brainNotes.id, note.id))

  return { summary }
}

async function handleEmbedNote(payload: { noteId: string }) {
  const [note] = await db
    .select({
      id: brainNotes.id,
      title: brainNotes.title,
      content: brainNotes.content,
      userId: brainNotes.userId,
      tags: brainNotes.tags,
      summary: brainNotes.summary,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(eq(brainNotes.id, payload.noteId))
    .limit(1)

  if (!note) throw new Error(`Note ${payload.noteId} not found`)

  const textToEmbed = `${note.title}\n\n${note.content.slice(0, 8000)}`

  // Generate embedding via Ollama (nomic-embed-text, 768-dim, private, on-prem)
  const embedding = await embed(textToEmbed)
  const model = 'nomic-embed-text'
  const dimensions = embedding.length

  // Upsert into Qdrant vector store
  await upsertNote({
    id: note.id,
    vector: embedding,
    payload: {
      noteId: note.id,
      userId: note.userId,
      title: note.title,
      tags: note.tags ?? [],
      summary: note.summary ?? undefined,
      updatedAt: note.updatedAt.toISOString(),
    },
  })

  // Also persist embedding in Postgres for backup / offline fallback
  await db
    .insert(brainEmbeddings)
    .values({ noteId: note.id, embeddingJson: embedding, model, dimensions })
    .onConflictDoUpdate({
      target: brainEmbeddings.noteId,
      set: { embeddingJson: embedding, model, dimensions, updatedAt: new Date() },
    })

  return { model, dimensions }
}

async function handleAutoLink(payload: { noteId: string; userId: string }) {
  const [note] = await db
    .select({ id: brainNotes.id, title: brainNotes.title, content: brainNotes.content })
    .from(brainNotes)
    .where(eq(brainNotes.id, payload.noteId))
    .limit(1)

  if (!note) throw new Error(`Note ${payload.noteId} not found`)

  // Get all other notes for this user (titles only for efficiency)
  const others = await db
    .select({ id: brainNotes.id, title: brainNotes.title, slug: brainNotes.slug })
    .from(brainNotes)
    .where(and(eq(brainNotes.userId, payload.userId), eq(brainNotes.isDeleted, false)))
    .limit(200)

  const otherTitles = others.filter(o => o.id !== note.id).map(o => o.title).join(', ')

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Given this note titled "${note.title}", which of the following notes should it link to? Return a JSON array of note titles that are semantically related. Return [] if none.\n\nAvailable notes: ${otherTitles}\n\nNote content:\n${note.content.slice(0, 2000)}`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
  let linkedTitles: string[] = []
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    linkedTitles = match ? JSON.parse(match[0]) : []
  } catch { /* ignore parse error */ }

  return { linkedTitles, count: linkedTitles.length }
}

// ── RSS Fetch Handler ─────────────────────────────────────────────────────────

async function handleRssFetch(payload: { feedId: string; userId: string }) {
  const [feed] = await db
    .select()
    .from(rssFeeds)
    .where(eq(rssFeeds.id, payload.feedId))
    .limit(1)

  if (!feed || !feed.isActive) throw new Error(`Feed ${payload.feedId} not found`)

  const res = await fetch(feed.feedUrl, {
    headers: { 'User-Agent': 'MeowdelRSSReader/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)

  const xml = await res.text()

  // Parse items (same minimal parser as the RSS route)
  const itemPattern = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi
  const getTag = (str: string, tag: string) => {
    const m = str.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>`, 'i')) ??
              str.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'))
    return m ? m[1].trim() : ''
  }

  const items: { title: string; link: string; guid: string; content: string }[] = []
  let match: RegExpExecArray | null
  while ((match = itemPattern.exec(xml)) !== null) {
    const item = match[1]
    const title = getTag(item, 'title')
    const link = item.match(/<link[^>]+href="([^"]+)"/i)?.[1] ?? getTag(item, 'link')
    const guid = getTag(item, 'guid') || getTag(item, 'id') || link
    const content = getTag(item, 'content:encoded') || getTag(item, 'content') || getTag(item, 'description')
    if (title && link && guid !== feed.lastItemGuid) {
      items.push({ title, link, guid, content })
    }
  }

  let imported = 0
  const jobValues: (typeof agentJobs.$inferInsert)[] = []

  for (const item of items.slice(0, 10)) {
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) + '-' + Date.now().toString(36)
    const markdown = item.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    const [note] = await db.insert(brainNotes).values({
      userId: payload.userId,
      slug,
      title: item.title,
      content: `> From: ${feed.title}\n> Source: [${item.link}](${item.link})\n\n---\n\n${markdown}`,
      tags: ['rss', 'feed'],
      wordCount: markdown.split(/\s+/).length,
      frontmatter: { source: 'rss', feedId: feed.id, guid: item.guid, importedAt: new Date().toISOString() },
    }).onConflictDoNothing().returning({ id: brainNotes.id })

    if (note) {
      imported++
      jobValues.push({ userId: payload.userId, jobType: 'embed_note', agentName: 'embedder', payload: { noteId: note.id }, priority: 9 })
    }
  }

  if (jobValues.length > 0) {
    await db.insert(agentJobs).values(jobValues).onConflictDoNothing()
  }

  // Update feed metadata
  await db.update(rssFeeds).set({
    lastFetchedAt: new Date(),
    importedCount: (feed.importedCount ?? 0) + imported,
    lastItemGuid: items[0]?.guid ?? feed.lastItemGuid,
  }).where(eq(rssFeeds.id, feed.id))

  return { imported, feedTitle: feed.title }
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

async function processJob(job: typeof agentJobs.$inferSelect) {
  const payload = (job.payload ?? {}) as Record<string, string>

  switch (job.jobType) {
    case 'summarize_note': return handleSummarizeNote(payload as { noteId: string })
    case 'embed_note': return handleEmbedNote(payload as { noteId: string })
    case 'auto_link': return handleAutoLink({ noteId: payload.noteId, userId: job.userId })
    case 'rss_fetch': return handleRssFetch({ feedId: payload.feedId, userId: payload.userId ?? job.userId })
    default: {
      // Swarm job types: swarm_analyze, swarm_organize, swarm_synthesize, swarm_deep_dive, swarm_auto
      if (job.jobType.startsWith('swarm_')) {
        const mode = job.jobType.replace('swarm_', '') as SwarmMode
        const p = job.payload as Record<string, string>
        return runSwarm({
          mode,
          userId: job.userId,
          input: p.input,
          context: p.context,
          noteId: p.noteId,
          sessionId: p.sessionId,
        })
      }
      throw new Error(`Unknown job type: ${job.jobType}`)
    }
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Simple secret auth — cron callers must include X-Worker-Secret header
  if (req.headers.get('x-worker-secret') !== WORKER_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()

  // Claim a batch of pending jobs
  const jobs = await db
    .select()
    .from(agentJobs)
    .where(and(
      eq(agentJobs.status, 'pending'),
      lte(agentJobs.scheduledFor, now),
    ))
    .orderBy(asc(agentJobs.priority), asc(agentJobs.scheduledFor))
    .limit(BATCH_SIZE)

  if (jobs.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      // Mark as running
      await db.update(agentJobs)
        .set({ status: 'running', startedAt: new Date(), attempts: job.attempts + 1 })
        .where(eq(agentJobs.id, job.id))

      try {
        const result = await processJob(job)
        await db.update(agentJobs)
          .set({ status: 'completed', result, completedAt: new Date() })
          .where(eq(agentJobs.id, job.id))
        return { id: job.id, status: 'completed' }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        const failed = job.attempts + 1 >= job.maxAttempts
        await db.update(agentJobs)
          .set({ status: failed ? 'failed' : 'pending', errorMessage, startedAt: null })
          .where(eq(agentJobs.id, job.id))
        return { id: job.id, status: failed ? 'failed' : 'retrying', error: errorMessage }
      }
    })
  )

  return NextResponse.json({
    processed: jobs.length,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
  })
}

// Health check
export async function GET(req: NextRequest) {
  if (req.headers.get('x-worker-secret') !== WORKER_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pending = await db
    .select({ id: agentJobs.id })
    .from(agentJobs)
    .where(eq(agentJobs.status, 'pending'))
    .limit(100)

  return NextResponse.json({ pendingJobs: pending.length, status: 'ok' })
}
