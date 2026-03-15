import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getPersonalityById, getAllPersonalities } from '@/lib/personality/engine'
import { searchBrain } from '@/lib/brain/rag'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Unified chat request schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000),
  personality: z.string().optional().default('mittens'),
  useBrainContext: z.boolean().optional().default(false),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).max(50).optional().default([]),
  stream: z.boolean().optional().default(false),
})

// API Key validation
function validateApiKey(request: NextRequest): { valid: boolean; userId?: string } {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')

  // TODO: Implement proper API key validation against database
  // For now, accept any key that starts with 'meow_'
  if (apiKey && apiKey.startsWith('meow_')) {
    return { valid: true, userId: apiKey }
  }

  return { valid: false }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const { valid, userId } = validateApiKey(request)
    if (!valid) {
      return NextResponse.json(
        {
          error: 'Invalid or missing API key',
          message: 'Include header: Authorization: Bearer meow_YOUR_KEY'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = chatRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { message, personality, useBrainContext, conversationHistory, stream } = validationResult.data

    // Get personality
    const personalityObj = getPersonalityById(personality)
    if (!personalityObj) {
      return NextResponse.json(
        {
          error: `Personality '${personality}' not found`,
          availablePersonalities: getAllPersonalities().map(p => p.id)
        },
        { status: 404 }
      )
    }

    // Brain RAG if requested
    let finalPrompt = message
    let brainContext: any[] = []

    if (useBrainContext) {
      const snippets = await searchBrain(message)
      if (snippets.length > 0) {
        brainContext = snippets.map(s => ({ id: s.id, relevance: s.score }))
        const contextXML = snippets.map(doc =>
          `<document id="${doc.id}">\n${doc.content}\n</document>`
        ).join('\n\n')
        finalPrompt = `${message}\n\n<brain_context>\n${contextXML}\n</brain_context>`
      }
    }

    // Build messages
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: finalPrompt }
    ]

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: personalityObj.systemPrompt,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    return NextResponse.json({
      success: true,
      data: {
        message: assistantMessage,
        personality: {
          id: personalityObj.id,
          name: personalityObj.name,
        },
        brainContext: useBrainContext ? brainContext : undefined,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to list available personalities
export async function GET(request: NextRequest) {
  const { valid } = validateApiKey(request)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const personalities = getAllPersonalities()

  return NextResponse.json({
    success: true,
    data: {
      personalities: personalities.map(p => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        personality: p.personality,
        greeting: p.greetings.first,
      }))
    }
  })
}
