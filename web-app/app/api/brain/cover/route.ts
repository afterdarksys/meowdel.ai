/**
 * AI Cover Image Generation for Brain Notes
 * Uses fal.ai to generate a visual cover for each note (Pro+)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'note_images')) {
    return NextResponse.json({ error: 'Pro plan required for AI cover images' }, { status: 403 })
  }

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  const [note] = await db
    .select({ id: brainNotes.id, title: brainNotes.title, summary: brainNotes.summary, tags: brainNotes.tags })
    .from(brainNotes)
    .where(and(eq(brainNotes.id, noteId), eq(brainNotes.userId, user.id)))
    .limit(1)

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const falKey = process.env.FAL_KEY
  if (!falKey) return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })

  const prompt = `Abstract digital art cover image for a knowledge note titled "${note.title}". ${
    note.summary ? `Theme: ${note.summary.slice(0, 100)}.` : ''
  } ${note.tags?.length ? `Keywords: ${note.tags.slice(0, 4).join(', ')}.` : ''}
  Dark background, neon accents, minimalist, futuristic, no text, 16:9 aspect ratio.`

  try {
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[cover] fal.ai error:', err)
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }

    const data = await res.json()
    const imageUrl = data.images?.[0]?.url

    if (!imageUrl) return NextResponse.json({ error: 'No image returned' }, { status: 500 })

    // Store cover URL in note frontmatter
    const [existing] = await db
      .select({ frontmatter: brainNotes.frontmatter })
      .from(brainNotes)
      .where(eq(brainNotes.id, note.id))
      .limit(1)

    const fm = (existing?.frontmatter as Record<string, unknown>) ?? {}
    await db.update(brainNotes)
      .set({ frontmatter: { ...fm, coverImage: imageUrl } })
      .where(eq(brainNotes.id, note.id))

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[cover] Error:', err)
    return NextResponse.json({ error: 'Failed to generate cover' }, { status: 500 })
  }
}
