import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPersonalityById } from '@/lib/personality/engine'

const visionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('human'),
    mood: z.string().default('neutral'),
    activity: z.string().optional(),
  }),
  z.object({
    type: z.literal('object'),
    object: z.string(),
    context: z.string().optional(),
  }),
  z.object({
    type: z.literal('code'),
    language: z.string(),
    hasError: z.boolean(),
    errorMessage: z.string().optional(),
  }),
  z.object({
    type: z.literal('text'),
    text: z.string().max(500),
  }),
])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  const { petId } = await context.params
  const personality = getPersonalityById(petId)
  if (!personality) {
    return NextResponse.json({ error: `Pet '${petId}' not found` }, { status: 404 })
  }

  const body = await request.json()
  const parsed = visionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues.map(i => i.message) },
      { status: 400 }
    )
  }

  const input = parsed.data
  let response: string

  switch (input.type) {
    case 'human':
      response = personality.visionResponses.seesHuman(input.mood, input.activity)
      break
    case 'object':
      response = personality.visionResponses.seesObject(input.object, input.context)
      break
    case 'code':
      response = personality.visionResponses.seesCode(input.language, input.hasError, input.errorMessage)
      break
    case 'text':
      response = personality.visionResponses.readsText(input.text)
      break
  }

  const photo = personality.selectPhoto({
    hasCode: input.type === 'code',
    mood: input.type === 'human' ? input.mood : undefined,
  })

  return NextResponse.json({
    success: true,
    response,
    photo,
    petId: personality.id,
    petName: personality.name,
  })
}
