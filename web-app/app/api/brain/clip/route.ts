/**
 * Web Clipper API
 *
 * POST /api/brain/clip
 * Body: { url: string; title?: string; tags?: string[] }
 *
 * Fetches the page, strips it to readable markdown using a lightweight
 * readability-style parser, then saves it as a Brain note.
 *
 * Also accepts raw HTML via body.html for the browser extension variant:
 * Body: { html: string; url: string; title?: string; tags?: string[] }
 *
 * Tier: free (rate-limited to 5/day on free, unlimited on pro+)
 *
 * Package needed: npm install @mozilla/readability jsdom turndown
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs } from '@/lib/db/schema'
import { count, and, eq, gte, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { AI_ACTION_LIMITS } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Rate limit tracking is approximate — uses a simple DB count for the day.
// For production, replace with Redis-based sliding window.
async function getDailyClipCount(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [row] = await db
    .select({ cnt: count() })
    .from(brainNotes)
    .where(
      and(
        eq(brainNotes.userId, userId),
        gte(brainNotes.createdAt, today),
        sql`${brainNotes.frontmatter}->>'source' = 'web_clipper'`
      )
    )

  return Number(row?.cnt ?? 0)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100)
}

/**
 * Convert HTML to rough Markdown using regex — no npm required, sufficient
 * for clipped content. For production, use the `turndown` package.
 */
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '#### $1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '_$1_')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '_$1_')
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<[uo]l[^>]*>/gi, '\n')
    .replace(/<\/[uo]l>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function fetchAndParseUrl(url: string): Promise<{ title: string; markdown: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MeowdelBot/1.0; +https://meowdel.ai)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`)

  const html = await res.text()

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const rawTitle = titleMatch ? titleMatch[1].trim() : url

  // Extract <article> or <main> or fall back to <body>
  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

  const bodyHtml = articleMatch ? articleMatch[1] : html
  const markdown = htmlToMarkdown(bodyHtml)

  return { title: rawTitle, markdown }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: free tier gets 5 clips/day
  const clipLimit = user.subscriptionTier === 'free' ? 5 : Infinity
  if (clipLimit !== Infinity) {
    const used = await getDailyClipCount(user.id)
    if (used >= clipLimit) {
      return NextResponse.json(
        { error: `Free tier allows ${clipLimit} clips per day. Upgrade to Pro for unlimited.` },
        { status: 429 }
      )
    }
  }

  const body = await req.json()
  const { url, html: rawHtml, title: overrideTitle, tags = [] } = body

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  let title: string
  let markdown: string

  if (rawHtml) {
    // Browser extension sent pre-extracted HTML
    title = overrideTitle ?? url
    markdown = htmlToMarkdown(rawHtml)
  } else {
    try {
      const parsed = await fetchAndParseUrl(url)
      title = overrideTitle ?? parsed.title
      markdown = parsed.markdown
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}` },
        { status: 422 }
      )
    }
  }

  if (!markdown || markdown.length < 50) {
    return NextResponse.json({ error: 'Page appears to have no readable content' }, { status: 422 })
  }

  const slug = slugify(title) + '-' + Date.now().toString(36)
  const wordCount = markdown.trim().split(/\s+/).length

  const noteContent = `> Clipped from: [${url}](${url})\n> Saved: ${new Date().toLocaleDateString()}\n\n---\n\n${markdown}`

  try {
    const [note] = await db
      .insert(brainNotes)
      .values({
        userId: user.id,
        slug,
        title,
        content: noteContent,
        tags: ['clipped', ...tags],
        wordCount,
        frontmatter: { source: 'web_clipper', url, clippedAt: new Date().toISOString() },
      })
      .returning({ id: brainNotes.id, slug: brainNotes.slug })

    // Queue AI processing
    await db.insert(agentJobs).values([
      {
        userId: user.id,
        jobType: 'summarize_note',
        agentName: 'summarizer',
        payload: { noteId: note.id, contentLength: noteContent.length },
        priority: 6,
      },
      {
        userId: user.id,
        jobType: 'embed_note',
        agentName: 'embedder',
        payload: { noteId: note.id },
        priority: 7,
      },
    ])

    return NextResponse.json({ success: true, id: note.id, slug: note.slug, title })
  } catch (err) {
    console.error('Web clipper save error:', err)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
