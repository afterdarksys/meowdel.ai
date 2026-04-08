/**
 * RSS/Atom Feed Reader
 *
 * GET  /api/brain/integrations/rss           — list user's subscribed feeds
 * POST /api/brain/integrations/rss           — subscribe to a feed or trigger fetch
 * DELETE /api/brain/integrations/rss?id=     — unsubscribe
 *
 * Feed polling is triggered via agent_jobs (job type: 'rss_fetch').
 * Add the rss_fetch handler to the agent-worker route.
 *
 * Tier: rss_feeds (pro)
 *
 * No npm packages needed — parses RSS/Atom XML natively.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rssFeeds, brainNotes, agentJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Minimal RSS/Atom parser — handles the 90% case without npm.
 * For full spec compliance in production, use `rss-parser` npm package.
 */
function parseRssFeed(xml: string): {
  title: string
  description: string
  siteUrl: string
  items: FeedItem[]
} {
  const getTag = (str: string, tag: string): string => {
    const m = str.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i')) ??
              str.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
    return m ? m[1].trim() : ''
  }

  const channelMatch = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i) ??
                       xml.match(/<feed[^>]*>([\s\S]*?)(?=<entry|$)/i)
  const channel = channelMatch?.[1] ?? xml

  const title = getTag(channel, 'title')
  const description = getTag(channel, 'description') || getTag(channel, 'subtitle')
  const siteUrl = getTag(channel, 'link')

  // Extract items — handles both RSS <item> and Atom <entry>
  const itemPattern = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi
  const items: FeedItem[] = []
  let match: RegExpExecArray | null

  while ((match = itemPattern.exec(xml)) !== null) {
    const item = match[1]
    const itemTitle = getTag(item, 'title')
    const link =
      item.match(/<link[^>]+href="([^"]+)"/i)?.[1] ??
      getTag(item, 'link')
    const guid = getTag(item, 'guid') || getTag(item, 'id') || link
    const pubDate = getTag(item, 'pubDate') || getTag(item, 'published') || getTag(item, 'updated')
    const content =
      getTag(item, 'content:encoded') ||
      getTag(item, 'content') ||
      getTag(item, 'description') ||
      getTag(item, 'summary')

    if (itemTitle && link) {
      items.push({ title: itemTitle, link, guid, pubDate, content })
    }
  }

  return { title, description, siteUrl, items }
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'rss_feeds')) {
    return NextResponse.json({ error: 'RSS feeds require Pro' }, { status: 403 })
  }

  const feeds = await db
    .select()
    .from(rssFeeds)
    .where(and(eq(rssFeeds.userId, user.id), eq(rssFeeds.isActive, true)))

  return NextResponse.json({ feeds })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'rss_feeds')) {
    return NextResponse.json({ error: 'RSS feeds require Pro' }, { status: 403 })
  }

  const body = await req.json()
  const { action = 'subscribe', feedId, feedUrl, autoImport = true } = body

  if (action === 'fetch' && feedId) {
    // Manually trigger a fetch for an existing feed
    await db.insert(agentJobs).values({
      userId: user.id,
      jobType: 'rss_fetch',
      agentName: 'rss-reader',
      payload: { feedId, userId: user.id },
      priority: 5,
    })
    return NextResponse.json({ success: true, message: 'Fetch queued' })
  }

  if (!feedUrl) return NextResponse.json({ error: 'feedUrl required' }, { status: 400 })

  // Validate and fetch the feed to get metadata
  let parsedFeed: ReturnType<typeof parseRssFeed>
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'MeowdelRSSReader/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Feed returned ${res.status}`)
    const xml = await res.text()
    parsedFeed = parseRssFeed(xml)
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot fetch feed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 422 }
    )
  }

  // Upsert feed subscription
  const [feed] = await db
    .insert(rssFeeds)
    .values({
      userId: user.id,
      feedUrl,
      title: parsedFeed.title || feedUrl,
      description: parsedFeed.description,
      siteUrl: parsedFeed.siteUrl || feedUrl,
      autoImport,
      lastFetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [rssFeeds.userId, rssFeeds.feedUrl],
      set: { isActive: true, autoImport, updatedAt: new Date() },
    })
    .returning()

  // Queue initial import
  await db.insert(agentJobs).values({
    userId: user.id,
    jobType: 'rss_fetch',
    agentName: 'rss-reader',
    payload: { feedId: feed.id, userId: user.id },
    priority: 5,
  })

  return NextResponse.json({
    success: true,
    feed: {
      id: feed.id,
      title: feed.title,
      feedUrl: feed.feedUrl,
      itemCount: parsedFeed.items.length,
    },
  })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db
    .update(rssFeeds)
    .set({ isActive: false })
    .where(and(eq(rssFeeds.id, id), eq(rssFeeds.userId, user.id)))

  return NextResponse.json({ success: true })
}

interface FeedItem {
  title: string
  link: string
  guid: string
  pubDate: string
  content: string
}
