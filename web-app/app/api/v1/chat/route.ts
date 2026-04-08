/**
 * POST /api/v1/chat
 * Public chat endpoint — authenticate with Authorization: Bearer mwdl_...
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getPersonalityById } from '@/lib/personality/engine'
import { searchBrain } from '@/lib/brain/rag'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const schema = z.object({
  message: z.string().min(1).max(10000),
  personality: z.string().default('meowdel'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(50).default([]),
})

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized — provide Authorization: Bearer mwdl_...' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { message, personality, conversationHistory } = parsed.data
  const pet = getPersonalityById(personality) ?? getPersonalityById('meowdel')!

  const brainSnippets = await searchBrain(message).catch(() => [])
  let finalMessage = message
  if (brainSnippets.length > 0) {
    const ctx = brainSnippets.map((d: {id: string; content: string}) => `<document id="${d.id}">\n${d.content}\n</document>`).join('\n\n')
    finalMessage = `${message}\n\n<brain_context>\n${ctx}\n</brain_context>`
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: finalMessage },
  ]

  const response = await anthropic.messages.create({
    model: process.env.DEFAULT_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: pet.systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const photo = pet.selectPhoto({ hasCode: !!message.match(/```|function|const|class|def/) })

  return NextResponse.json({
    message: text,
    personality: pet.id,
    photo,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    timestamp: new Date().toISOString(),
  })
}
