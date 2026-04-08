/**
 * Notion Integration — import pages from a Notion workspace into Brain notes.
 *
 * GET  /api/brain/integrations/notion          — list available Notion pages/databases
 * POST /api/brain/integrations/notion          — import selected pages
 *
 * Authentication: user provides their Notion Integration Token in their
 * integration settings (stored in the integrations table).
 *
 * Tier: notion_import (pro)
 *
 * No npm package needed — uses Notion REST API directly.
 *
 * Env vars: none required server-side (user provides their own token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs, integrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

/** Recursively extract plain text from Notion rich_text array */
function richTextToString(richText: NotionRichText[]): string {
  return richText.map((t) => t.plain_text ?? '').join('')
}

/** Convert a Notion block to markdown string */
function blockToMarkdown(block: NotionBlock): string {
  const type = block.type
  const b = block[type] as NotionBlockContent

  switch (type) {
    case 'paragraph':
      return richTextToString(b.rich_text ?? []) + '\n\n'
    case 'heading_1':
      return `# ${richTextToString(b.rich_text ?? [])}\n\n`
    case 'heading_2':
      return `## ${richTextToString(b.rich_text ?? [])}\n\n`
    case 'heading_3':
      return `### ${richTextToString(b.rich_text ?? [])}\n\n`
    case 'bulleted_list_item':
      return `- ${richTextToString(b.rich_text ?? [])}\n`
    case 'numbered_list_item':
      return `1. ${richTextToString(b.rich_text ?? [])}\n`
    case 'to_do':
      return `- [${b.checked ? 'x' : ' '}] ${richTextToString(b.rich_text ?? [])}\n`
    case 'code':
      return `\`\`\`${b.language ?? ''}\n${richTextToString(b.rich_text ?? [])}\n\`\`\`\n\n`
    case 'quote':
      return `> ${richTextToString(b.rich_text ?? [])}\n\n`
    case 'divider':
      return `---\n\n`
    case 'callout':
      return `> **${b.icon?.emoji ?? '💡'}** ${richTextToString(b.rich_text ?? [])}\n\n`
    case 'toggle':
      return `<details><summary>${richTextToString(b.rich_text ?? [])}</summary>\n\n</details>\n\n`
    default:
      if (b?.rich_text) return richTextToString(b.rich_text) + '\n\n'
      return ''
  }
}

async function fetchPageBlocks(pageId: string, token: string): Promise<string> {
  let markdown = ''
  let cursor: string | undefined

  do {
    const url = new URL(`${NOTION_API}/blocks/${pageId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const res = await fetch(url.toString(), { headers: notionHeaders(token) })
    if (!res.ok) break

    const data = await res.json()
    cursor = data.has_more ? data.next_cursor : undefined

    for (const block of data.results ?? []) {
      markdown += blockToMarkdown(block)
    }
  } while (cursor)

  return markdown.trim()
}

async function fetchNotionPages(token: string) {
  const res = await fetch(`${NOTION_API}/search`, {
    method: 'POST',
    headers: notionHeaders(token),
    body: JSON.stringify({ filter: { property: 'object', value: 'page' }, page_size: 50 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error: ${err}`)
  }

  const data = await res.json()
  return data.results ?? []
}

function getNotionToken(integration: typeof integrations.$inferSelect): string {
  return (integration.accessToken ?? '') || ((integration.config as Record<string, string>)?.apiKey ?? '')
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'notion_import')) {
    return NextResponse.json({ error: 'Notion import requires Pro' }, { status: 403 })
  }

  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, user.id), eq(integrations.provider, 'notion')))
    .limit(1)

  if (!integration) {
    return NextResponse.json({ error: 'Notion integration not configured', setup_required: true })
  }

  const token = getNotionToken(integration)
  if (!token) {
    return NextResponse.json({ error: 'Notion API token missing', setup_required: true })
  }

  try {
    const pages = await fetchNotionPages(token)
    const simplified = pages.map((p: NotionPage) => ({
      id: p.id,
      title:
        p.properties?.title?.title?.[0]?.plain_text ??
        p.properties?.Name?.title?.[0]?.plain_text ??
        'Untitled',
      url: p.url,
      lastEdited: p.last_edited_time,
    }))

    return NextResponse.json({ pages: simplified })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Notion API failed' },
      { status: 502 }
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'notion_import')) {
    return NextResponse.json({ error: 'Notion import requires Pro' }, { status: 403 })
  }

  // Allow user-provided token as fallback for one-off imports
  const body = await req.json()
  const { pageIds, apiKey: bodyToken } = body as { pageIds: string[]; apiKey?: string }

  if (!pageIds?.length) {
    return NextResponse.json({ error: 'pageIds array required' }, { status: 400 })
  }

  let token = bodyToken ?? ''

  if (!token) {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, user.id), eq(integrations.provider, 'notion')))
      .limit(1)

    if (integration) token = getNotionToken(integration)
  }

  if (!token) {
    return NextResponse.json({ error: 'Notion API token required' }, { status: 400 })
  }

  const imported: { title: string; slug: string }[] = []
  const failed: { pageId: string; error: string }[] = []

  for (const pageId of pageIds.slice(0, 20)) {
    try {
      // Fetch page metadata
      const metaRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
        headers: notionHeaders(token),
      })
      if (!metaRes.ok) throw new Error(`Page fetch failed: ${metaRes.status}`)
      const meta: NotionPage = await metaRes.json()

      const title =
        meta.properties?.title?.title?.[0]?.plain_text ??
        meta.properties?.Name?.title?.[0]?.plain_text ??
        `Notion Page ${pageId.slice(0, 8)}`

      const content = await fetchPageBlocks(pageId, token)

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 80) +
        '-' +
        Date.now().toString(36)

      const noteContent = `> Imported from Notion: [${title}](${meta.url})\n> Last edited: ${meta.last_edited_time}\n\n---\n\n${content}`

      const [note] = await db
        .insert(brainNotes)
        .values({
          userId: user.id,
          slug,
          title,
          content: noteContent,
          tags: ['notion', 'imported'],
          wordCount: content.split(/\s+/).length,
          frontmatter: {
            source: 'notion',
            notionPageId: pageId,
            importedAt: new Date().toISOString(),
          },
        })
        .onConflictDoNothing()
        .returning({ id: brainNotes.id, slug: brainNotes.slug })

      if (note) {
        imported.push({ title, slug: note.slug })
        await db.insert(agentJobs).values({
          userId: user.id,
          jobType: 'embed_note',
          agentName: 'embedder',
          payload: { noteId: note.id },
          priority: 7,
        })
      }
    } catch (err) {
      failed.push({ pageId, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return NextResponse.json({ success: true, imported: imported.length, failed: failed.length, notes: imported })
}

// ── Notion type stubs (avoid npm package) ─────────────────────────────────────

interface NotionRichText {
  plain_text?: string
  type?: string
}

interface NotionBlockContent {
  rich_text?: NotionRichText[]
  checked?: boolean
  language?: string
  icon?: { emoji?: string }
}

interface NotionBlock {
  type: string
  [key: string]: unknown
}

interface NotionPage {
  id: string
  url: string
  last_edited_time: string
  properties?: {
    title?: { title?: NotionRichText[] }
    Name?: { title?: NotionRichText[] }
    [key: string]: unknown
  }
}
