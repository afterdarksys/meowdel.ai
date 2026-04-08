/**
 * YouTube Transcript Import
 *
 * POST /api/brain/youtube
 * Body: { url: string; summarize?: boolean }
 *
 * Fetches the YouTube auto-transcript (no API key required — uses the
 * publicly available timedtext endpoint), then optionally summarizes it
 * with Claude and saves as a Brain note.
 *
 * Tier: pro
 *
 * Package needed: npm install youtube-transcript
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs } from '@/lib/db/schema'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/**
 * Fetches transcript from YouTube's timedtext API.
 * No API key required — this is the same endpoint the YouTube player uses.
 * Falls back to youtube-transcript npm package if direct fetch fails.
 */
async function fetchTranscript(videoId: string): Promise<string> {
  // Attempt 1: direct timedtext API
  const infoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const pageRes = await fetch(infoUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  })

  if (pageRes.ok) {
    const html = await pageRes.text()
    // Extract "captionTracks" from ytInitialPlayerResponse
    const captionTracksIdx = html.indexOf('"captionTracks"')
    const captionTracksRaw = captionTracksIdx >= 0 ? html.slice(captionTracksIdx) : ''
    const match = captionTracksRaw.match(/"captionTracks":\s*(\[[\s\S]{0,4000}?\])/)
    if (match) {
      try {
        const tracks = JSON.parse(match[1].replace(/\\"/g, '"').replace(/\\u0026/g, '&'))
        const en = tracks.find(
          (t: { languageCode: string; baseUrl: string }) =>
            t.languageCode === 'en' || t.languageCode === 'en-US'
        ) ?? tracks[0]

        if (en?.baseUrl) {
          const captionRes = await fetch(en.baseUrl + '&fmt=json3', {
            signal: AbortSignal.timeout(8000),
          })
          if (captionRes.ok) {
            const captionData = await captionRes.json()
            const lines: string[] = (captionData.events ?? [])
              .filter((e: { segs?: { utf8: string }[] }) => Array.isArray(e.segs))
              .map((e: { segs: { utf8: string }[] }) => e.segs.map((s: { utf8: string }) => s.utf8).join(''))
              .filter(Boolean)
            return lines.join(' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
          }
        }
      } catch {
        // Fall through to next method
      }
    }
  }

  // Attempt 2: youtube-transcript npm package
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map((t: { text: string }) => t.text).join(' ').trim()
  } catch {
    throw new Error(
      'Could not fetch transcript. The video may have no captions, or captions are disabled.'
    )
  }
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const m = html.match(/<title>([^<]*)<\/title>/)
    if (m) return m[1].replace(' - YouTube', '').trim()
  } catch { /* ignore */ }
  return `YouTube Video ${videoId}`
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'youtube_import')) {
    return NextResponse.json({ error: 'YouTube import requires Pro' }, { status: 403 })
  }

  const { url, summarize = true } = await req.json()
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const videoId = extractVideoId(url)
  if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })

  const [videoTitle, rawTranscript] = await Promise.all([
    fetchVideoTitle(videoId),
    fetchTranscript(videoId).catch((e) => {
      throw e
    }),
  ]).catch((err) => {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transcript fetch failed' },
      { status: 422 }
    )
  }) as [string, string]

  // Optionally summarize with Claude
  let summarySection = ''
  if (summarize && rawTranscript.length > 200) {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Summarize the key points from this YouTube video transcript in 3-5 bullet points. Be concise and informative.\n\nTranscript:\n${rawTranscript.slice(0, 8000)}`,
        },
      ],
    })
    const summary = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    if (summary) {
      summarySection = `## Key Points\n\n${summary}\n\n---\n\n`
    }
  }

  const noteContent = `> Source: [${videoTitle}](${url})\n> Imported: ${new Date().toLocaleDateString()}\n\n${summarySection}## Full Transcript\n\n${rawTranscript}`

  const slug =
    videoTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80) +
    '-' +
    Date.now().toString(36)

  const wordCount = rawTranscript.trim().split(/\s+/).length

  const [note] = await db
    .insert(brainNotes)
    .values({
      userId: user.id,
      slug,
      title: videoTitle,
      content: noteContent,
      tags: ['youtube', 'transcript'],
      wordCount,
      frontmatter: { source: 'youtube', videoId, url, importedAt: new Date().toISOString() },
    })
    .returning({ id: brainNotes.id, slug: brainNotes.slug })

  // Queue embedding
  await db.insert(agentJobs).values({
    userId: user.id,
    jobType: 'embed_note',
    agentName: 'embedder',
    payload: { noteId: note.id },
    priority: 6,
  })

  return NextResponse.json({ success: true, id: note.id, slug: note.slug, title: videoTitle, wordCount })
}
