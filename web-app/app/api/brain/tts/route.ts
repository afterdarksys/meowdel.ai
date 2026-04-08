/**
 * Text-to-Speech — read a note aloud using ElevenLabs
 *
 * POST /api/brain/tts
 * Body: { text: string; voiceId?: string; noteSlug?: string }
 *
 * Returns an audio/mpeg stream.
 *
 * Tier: tts (pro)
 * Env vars: ELEVENLABS_API_KEY (already present per existing voice features)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Default voice — Rachel (calm, clear narration voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

// ElevenLabs multilingual v2 model — best quality for long-form reading
const TTS_MODEL = 'eleven_multilingual_v2'

// Character limit per request (ElevenLabs free: 10k/mo, pro: unlimited)
const MAX_CHARS = 5000

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]*`/g, '')         // inline code
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text only
    .replace(/^>\s+/gm, '')           // blockquotes
    .replace(/^[-*]\s+/gm, '')        // list markers
    .replace(/^\d+\.\s+/gm, '')       // numbered list
    .replace(/---+/g, '')             // dividers
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'tts')) {
    return NextResponse.json({ error: 'Text-to-speech requires Pro' }, { status: 403 })
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY
  if (!elevenKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })

  const { text: rawText, voiceId = DEFAULT_VOICE_ID } = await req.json()
  if (!rawText) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  // Strip markdown for cleaner audio
  const text = stripMarkdown(rawText).slice(0, MAX_CHARS)

  if (text.length < 3) {
    return NextResponse.json({ error: 'Text too short for TTS' }, { status: 400 })
  }

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
        optimize_streaming_latency: 3,
      }),
    }
  )

  if (!elevenRes.ok) {
    const err = await elevenRes.text()
    console.error('ElevenLabs TTS error:', err)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
  }

  // Stream audio back to the client
  return new NextResponse(elevenRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Text-Length': String(text.length),
    },
  })
}
