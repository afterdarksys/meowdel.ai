import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getPersonalityById } from '@/lib/personality/engine'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  userId: z.string().optional(),
  apiKey: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).max(50, 'Conversation history too long').optional().default([]),
})

// Simple in-memory rate limiting for demonstration/MVP
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await context.params;

    // 1. Load pet personality mapping
    const personality = getPersonalityById(petId);
    if (!personality) {
      return NextResponse.json({ error: `Pet personality '${petId}' not found` }, { status: 404 });
    }

    const body = await request.json()

    // 2. Validate input
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

    const { message, conversationHistory, userId, apiKey } = validationResult.data

    // 3. Authenticate & Rate Limit
    const identifier = apiKey || userId || request.headers.get('x-forwarded-for') || 'anonymous';
    // Limit: 20 requests per minute
    if (!checkRateLimit(identifier, 20, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    // 4. Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string, content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // 5. Call Claude API With Personality
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: personality.systemPrompt,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // 6. Select appropriate photo
    const hasCode = message.match(/```|function|const|let|var|class|def|import/)
    const photo = personality.selectPhoto({
      hasCode: !!hasCode,
      activity: hasCode ? 'coding' : undefined
    })

    return NextResponse.json({
      success: true,
      response: {
        message: assistantMessage,
        petId: personality.id,
        petName: personality.name,
        photo,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to get Pet info
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  const { petId } = await context.params;

  const personality = getPersonalityById(petId);
  if (!personality) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    pet: {
      id: personality.id,
      name: personality.name,
      breed: personality.breed,
      personality: personality.personality,
      greeting: personality.greetings.first,
      photo: personality.photos.playing[0]
    }
  })
}
