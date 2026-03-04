import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage, VisionContext } from '@/lib/vision/analyzer'

/**
 * POST /api/vision/analyze
 * Analyze an uploaded image or webcam frame
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, prompt, source, userId, sessionId } = body

    // Validate input
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    // Build context
    const context: VisionContext = {
      userId,
      sessionId,
      timestamp: new Date(),
      source: source || 'upload',
    }

    // Analyze image
    const analysis = await analyzeImage(
      image,
      prompt || '*sniff sniff* What do you see, hooman?',
      context
    )

    // TODO: Store analysis in database for history
    // await db.visionAnalyses.create({...})

    // TODO: Track usage for billing
    // await trackVisionUsage(userId, 1)

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Vision API] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vision/analyze
 * Get vision analysis history for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    // TODO: Fetch from database
    // const history = await db.visionAnalyses.findMany({
    //   where: { userId },
    //   orderBy: { createdAt: 'desc' },
    //   take: limit
    // })

    return NextResponse.json({
      success: true,
      history: [],
      count: 0,
    })

  } catch (error) {
    console.error('[Vision API] Error fetching history:', error)

    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
