import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getPersonalityById } from '@/lib/personality/engine'
import { searchBrain } from '@/lib/brain/rag'
import { getSession } from '@/lib/auth/session'
import { route } from '@/lib/intelligence/router'
import { readCascadeContext, writeCascadeMemory } from '@/lib/intelligence/cascade'
import { resolveSkills, buildSkillPrompt, escalateTierForSkills } from '@/lib/intelligence/skills'

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

    const { message, conversationHistory, userId: bodyUserId, apiKey } = validationResult.data

    // 3. Authenticate & Rate Limit
    const session = await getSession()
    const identifier = session?.id || apiKey || bodyUserId || request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(identifier, 20, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    // 4. Route to model tier + parse user commands
    const { tier, model, reason, command } = route(message, conversationHistory)
    const cleanMessage = command.cleanMessage || message

    // 4a. Resolve active skills and potentially escalate tier
    const activeSkills = resolveSkills(command.activeSkillSlugs)
    const finalTier = escalateTierForSkills(tier, activeSkills)
    const finalModel = finalTier !== tier
      ? (await import('@/lib/intelligence/router')).MODELS[finalTier]
      : model

    // 5. Fetch cascade memory + brain RAG in parallel
    const [cascadeCtx, brainSnippets] = await Promise.all([
      session ? readCascadeContext(session.id, finalTier, cleanMessage) : Promise.resolve({ memories: [], formatted: '' }),
      searchBrain(cleanMessage),
    ])

    // 6. Build prompt with all context
    let finalPrompt = cleanMessage
    if (brainSnippets.length > 0) {
      const contextXML = brainSnippets.map(doc => `<document id="${doc.id}">\n${doc.content}\n</document>`).join('\n\n')
      finalPrompt += `\n\n<brain_context>\n${contextXML}\n</brain_context>`
    }

    // Build system prompt = personality + cascade memories + active skills
    const skillPrompt = buildSkillPrompt(activeSkills)
    const systemPrompt = personality.systemPrompt
      + (cascadeCtx.formatted ? `\n\n${cascadeCtx.formatted}` : '')
      + skillPrompt

    // 7. Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: finalPrompt },
    ]

    // 8. Call Claude with routed model
    const response = await anthropic.messages.create({
      model: finalModel,
      max_tokens: finalTier === 'haiku' ? 512 : finalTier === 'opus' ? 4096 : 1024,
      system: systemPrompt,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // 9. Store cascade memory (async, don't await — don't slow down response)
    if (session) {
      writeCascadeMemory({
        userId: session.id,
        tier: finalTier,
        userMessage: cleanMessage,
        assistantResponse: assistantMessage,
        saveToCascade: command.saveToCascade,
      }).catch(() => {})
    }

    // 10. Select photo
    const hasCode = cleanMessage.match(/```|function|const|let|var|class|def|import/)
    const photo = personality.selectPhoto({ hasCode: !!hasCode, activity: hasCode ? 'coding' : undefined })

    return NextResponse.json({
      success: true,
      response: {
        message: assistantMessage,
        petId: personality.id,
        petName: personality.name,
        photo,
        timestamp: new Date().toISOString(),
        // Expose routing metadata to clients
        _routing: {
          tier: finalTier,
          model: finalModel,
          reason,
          activeSkills: activeSkills.map(s => s.slug),
          cascadeMemoriesUsed: cascadeCtx.memories.length,
        },
      },
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
