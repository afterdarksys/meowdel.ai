/**
 * Inline AI Writing Assistant
 *
 * POST /api/brain/inline-ai
 * Body: { action: string; text: string; context?: string; targetLanguage?: string }
 *
 * Supports the full slash-command suite:
 *   improve, summarize, expand, rewrite, translate, bullet_points,
 *   make_shorter, make_longer, fix_grammar, continue_writing, cat
 *
 * Auth: requires session (free tier gets basic actions; pro gets full suite)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })

// Actions available on free tier
const FREE_ACTIONS = new Set(['improve', 'summarize', 'fix_grammar', 'cat'])

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, text, context, targetLanguage = 'Spanish' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text to transform is required' }, { status: 400 })
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: 'Text too long (max 10,000 characters)' }, { status: 400 })
    }

    // Gate advanced actions behind pro
    if (!FREE_ACTIONS.has(action) && user.subscriptionTier === 'free') {
      return NextResponse.json(
        { error: `The "${action}" action requires a Pro subscription` },
        { status: 403 }
      )
    }

    let prompt = ''

    switch (action) {
      case 'improve':
        prompt = `Improve the following text for clarity, flow, and impact while maintaining its original meaning and voice. Return ONLY the improved text, without quotes or explanation:\n\n${text}`
        break
      case 'summarize':
        prompt = `Write a concise 1-2 sentence TL;DR summary of the following text. Return ONLY the summary, without quotes or explanation:\n\n${text}`
        break
      case 'expand':
        prompt = `Expand upon the following idea, adding significantly more detail, context, examples, and depth. Keep the same voice and style. Return ONLY the expanded text:\n\n${text}`
        break
      case 'rewrite':
        prompt = `Completely rewrite the following text with a fresh perspective, different structure, but preserving the core ideas. Return ONLY the rewritten text:\n\n${text}`
        break
      case 'translate':
        prompt = `Translate the following text into ${targetLanguage}. Preserve all markdown formatting. Return ONLY the translated text, no explanation:\n\n${text}`
        break
      case 'bullet_points':
        prompt = `Convert the following text into a clear, well-structured bullet-point list. Use markdown list syntax. Return ONLY the bullet points:\n\n${text}`
        break
      case 'make_shorter':
        prompt = `Make the following text significantly more concise without losing key information. Cut at least 40% of the length. Return ONLY the shortened text:\n\n${text}`
        break
      case 'make_longer':
        prompt = `Expand the following text to be much more detailed and comprehensive. Add supporting points, examples, and elaboration. Return ONLY the longer version:\n\n${text}`
        break
      case 'fix_grammar':
        prompt = `Fix all grammar, spelling, punctuation, and style issues in the following text. Preserve the original voice and meaning exactly. Return ONLY the corrected text:\n\n${text}`
        break
      case 'continue_writing':
        prompt = `Continue writing from where the following text ends. Match the style, tone, and voice perfectly. Write 2-4 paragraphs of continuation. Return ONLY the continuation (not the original):\n\n${text}`
        break
      case 'explain_like_5':
        prompt = `Explain the following concept as if explaining to a 5-year-old. Use simple language, analogies, and no jargon. Return ONLY the simplified explanation:\n\n${text}`
        break
      case 'make_formal':
        prompt = `Rewrite the following text in formal, professional language suitable for business or academic contexts. Return ONLY the formal version:\n\n${text}`
        break
      case 'make_casual':
        prompt = `Rewrite the following text in casual, conversational language as if talking to a friend. Return ONLY the casual version:\n\n${text}`
        break
      case 'find_action_items':
        prompt = `Extract all action items, tasks, and TODOs from the following text. Format as a markdown checklist (- [ ] item). Return ONLY the checklist:\n\n${text}`
        break
      case 'cat':
        prompt = `Rewrite the following text from the perspective of a highly intelligent, slightly sassy cat (Meowdel). Use subtle feline puns (purr-fect, pawsitive, etc.) but keep the core information intact. Return ONLY the rewritten text:\n\n${text}`
        break
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    // Prepend document context for better results
    if (context && context.length > 20) {
      const ctxSnippet = context.slice(0, 1500)
      prompt = `Document context (for reference only):\n${ctxSnippet}\n\n---\n\n${prompt}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system:
        'You are an AI text transformation utility embedded in a writing editor. You strictly follow instructions and return ONLY the requested modified text. Never use conversational filler like "Here is the improved text:". Never wrap output in quotes.',
      messages: [{ role: 'user', content: prompt }],
    })

    const resultText = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ result: resultText.trim() })
  } catch (error: unknown) {
    console.error('Inline AI error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transform text' },
      { status: 500 }
    )
  }
}
