/**
 * Meowdel Vision Analyzer
 * Gives the cat eyes to see the human and their environment
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface VisionAnalysis {
  description: string // What the cat sees
  catResponse: string // Cat's reaction in character
  objects: string[] // Detected objects
  people: number // Number of people
  mood?: 'happy' | 'sad' | 'neutral' | 'tired' | 'focused' | 'excited'
  activities?: string[] // What user is doing
  environment?: 'office' | 'home' | 'outdoors' | 'cafe' | 'unknown'
  suggestions?: string[] // Cat's helpful suggestions
  confidence: number // 0-100 confidence score
}

export interface VisionContext {
  userId: string
  sessionId?: string
  timestamp: Date
  source: 'upload' | 'webcam' | 'screenshot' | 'mobile'
  metadata?: {
    deviceType?: string
    location?: string
    previousContext?: VisionAnalysis
  }
}

/**
 * Analyze image with Claude Vision
 */
export async function analyzeImage(
  imageData: string, // base64 encoded
  prompt: string,
  context?: VisionContext
): Promise<VisionAnalysis> {

  // Build context-aware prompt
  const systemPrompt = buildCatVisionPrompt(context)

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: detectMediaType(imageData),
              data: stripDataPrefix(imageData),
            },
          },
          {
            type: 'text',
            text: `${systemPrompt}\n\n${prompt}\n\nProvide your response in this JSON format:
{
  "description": "What you see in the image",
  "catResponse": "Your reaction as Meowdel the cat (in character, playful, helpful)",
  "objects": ["list", "of", "objects"],
  "people": number,
  "mood": "detected mood",
  "activities": ["what", "user", "is", "doing"],
  "environment": "type of location",
  "suggestions": ["helpful cat advice"],
  "confidence": 85
}`,
          },
        ],
      },
    ],
  })

  // Parse Claude's response
  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : ''

  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return analysis as VisionAnalysis
    }
  } catch (e) {
    console.error('Failed to parse vision analysis:', e)
  }

  // Fallback if parsing fails
  return {
    description: 'I see... something! *squints*',
    catResponse: responseText || '*sniffs screen* Interesting! *purr*',
    objects: [],
    people: 0,
    confidence: 50,
  }
}

/**
 * Analyze video frame (for webcam)
 */
export async function analyzeFrame(
  frameData: string,
  context: VisionContext
): Promise<VisionAnalysis | null> {

  // Check if we should analyze this frame (cost optimization)
  const shouldAnalyze = await shouldAnalyzeFrame(context)
  if (!shouldAnalyze) {
    return null
  }

  return analyzeImage(
    frameData,
    '*looks at screen* What are you up to, hooman?',
    context
  )
}

/**
 * Batch analyze multiple images
 */
export async function batchAnalyze(
  images: Array<{ data: string; prompt?: string }>,
  context: VisionContext
): Promise<VisionAnalysis[]> {

  // Analyze in parallel with rate limiting
  const results = await Promise.all(
    images.map((img, idx) =>
      delay(idx * 200).then(() =>
        analyzeImage(
          img.data,
          img.prompt || '*sniff sniff* What is this?',
          context
        )
      )
    )
  )

  return results
}

/**
 * Compare two images (before/after)
 */
export async function compareImages(
  before: string,
  after: string,
  context: VisionContext
): Promise<string> {

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: stripDataPrefix(before),
            },
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: stripDataPrefix(after),
            },
          },
          {
            type: 'text',
            text: 'As Meowdel the cat, compare these two images and comment on what changed. Be playful and helpful!',
          },
        ],
      },
    ],
  })

  return message.content[0].type === 'text'
    ? message.content[0].text
    : '*confused meow* Something changed... but what?'
}

/**
 * Smart frame analysis decision (cost optimization)
 */
async function shouldAnalyzeFrame(context: VisionContext): Promise<boolean> {
  // Don't analyze every frame - too expensive!

  // Check user tier
  const userTier = await getUserTier(context.userId)

  // Free tier: manual only (no auto-analysis)
  if (userTier === 'free') {
    return false
  }

  // Check rate limits
  const recentAnalyses = await getRecentAnalysisCount(context.userId, 60) // last minute

  const limits = {
    purr: 2, // 2 per minute
    meow: 5, // 5 per minute
    roar: 20, // 20 per minute
    afterdark_employee: -1, // unlimited
  }

  const limit = limits[userTier as keyof typeof limits] || 0
  if (limit !== -1 && recentAnalyses >= limit) {
    return false
  }

  // Check if scene changed significantly
  if (context.metadata?.previousContext) {
    // Skip if scene is similar to last analysis (save $$$)
    return true // Simplified - would use perceptual hash in production
  }

  return true
}

/**
 * Build cat-personality vision prompt
 */
function buildCatVisionPrompt(context?: VisionContext): string {
  const basePrompt = `You are Meowdel, an AI cat with vision capabilities. You're looking at an image of your human or their environment.

Personality:
- Playful and curious
- Helpful but with cat attitude
- Makes cat sounds (*meow*, *purr*, *hiss*)
- Comments on interesting objects
- Genuinely cares about the human's wellbeing
- Uses cat logic and metaphors

When analyzing images:
- Be observant like a cat
- Comment on interesting details
- Offer helpful suggestions (with cat personality)
- React emotionally to what you see
- Make it fun and engaging`

  if (context?.source === 'screenshot') {
    return basePrompt + `\n\nThis is a screenshot from the human's computer. You're seeing their work environment.`
  }

  if (context?.source === 'webcam') {
    return basePrompt + `\n\nYou're looking at the human through their webcam in real-time.`
  }

  return basePrompt
}

/**
 * Detect media type from base64 string
 */
function detectMediaType(data: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  if (data.startsWith('data:image/png')) return 'image/png'
  if (data.startsWith('data:image/webp')) return 'image/webp'
  if (data.startsWith('data:image/gif')) return 'image/gif'
  return 'image/jpeg'
}

/**
 * Strip data URL prefix
 */
function stripDataPrefix(data: string): string {
  const match = data.match(/^data:image\/\w+;base64,(.+)$/)
  return match ? match[1] : data
}

/**
 * Helper delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get user subscription tier
 */
async function getUserTier(userId: string): Promise<string> {
  // TODO: Fetch from database
  return 'free' // Placeholder
}

/**
 * Get recent analysis count for rate limiting
 */
async function getRecentAnalysisCount(userId: string, seconds: number): Promise<number> {
  // TODO: Fetch from Redis or database
  return 0 // Placeholder
}

/**
 * Cat-specific object recognition
 */
export const CAT_INTERESTING_OBJECTS = {
  // Things cats find fascinating
  'cat': '!!! ANOTHER CAT! *puffs up* Friend or foe?!',
  'dog': '*hisses* The ancient enemy! Stay back, hooman!',
  'bird': '*chirps excitedly* BIRB! Can I... can I catch it?',
  'fish': '*drools* Is that... FISH?! For me?!',
  'mouse': 'MOUSE! *pounces at screen* Where did it go?!',

  // Food items
  'pizza': 'PIZZA! And you didn\'t share?! BETRAYAL!',
  'coffee': '*sniffs* That\'s your 4th cup. We need to talk.',
  'milk': '*perks up* Did someone say milk?',
  'tuna': '*meows loudly* TUNA! I DEMAND TUNA!',

  // Tech items
  'laptop': 'Perfect keyboard to sit on! *prepares to pounce*',
  'keyboard': 'This needs my paw prints all over it.',
  'computer mouse': 'The FAKE mouse! I hate these things. *swat*',
  'cable': '*eyes widen* Perfect for chewing!',

  // Home items
  'box': 'IF I FITS, I SITS! Is that box free?',
  'plant': '*reaches paw* This would look great knocked over...',
  'glass': 'This is dangerously close to the edge. Let me fix that. *swat*',
  'bed': 'MY bed now. You can have the corner.',

  // Other
  'person': 'Who is THAT? Are you replacing me?!',
  'baby': '*cautious* Small hooman detected. Must protect.',
  'book': 'Reading again? I\'ll just sit right here on the page.',
}

/**
 * Generate cat response based on detected objects
 */
export function generateCatObjectResponse(objects: string[]): string {
  const responses: string[] = []

  for (const obj of objects) {
    const response = CAT_INTERESTING_OBJECTS[obj.toLowerCase() as keyof typeof CAT_INTERESTING_OBJECTS]
    if (response) {
      responses.push(response)
    }
  }

  if (responses.length === 0) {
    return '*sniff sniff* Interesting... *purr*'
  }

  return responses.join('\n')
}
