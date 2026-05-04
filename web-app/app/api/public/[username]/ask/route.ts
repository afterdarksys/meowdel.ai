import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { userProfiles, brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { question } = await request.json()
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  const username = params.username.replace(/^@/, '')

  // Look up the user profile
  const [profile] = await db
    .select({
      userId: userProfiles.userId,
      displayName: userProfiles.displayName,
      isPublic: userProfiles.isPublic,
    })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (!profile.isPublic) {
    return NextResponse.json({ error: 'This brain is private' }, { status: 403 })
  }

  // Fetch their public notes
  const notes = await db
    .select({
      title: brainNotes.title,
      summary: brainNotes.summary,
      content: brainNotes.content,
      slug: brainNotes.slug,
    })
    .from(brainNotes)
    .where(
      and(
        eq(brainNotes.userId, profile.userId),
        eq(brainNotes.isPublic, true),
        eq(brainNotes.isDeleted, false),
      )
    )
    .limit(20)

  if (notes.length === 0) {
    return NextResponse.json({ answer: "This brain hasn't published any notes yet." })
  }

  const notesContext = notes
    .map((n, i) => `[Note ${i + 1}: "${n.title}"]\n${n.summary || n.content.slice(0, 800)}`)
    .join('\n\n---\n\n')

  const displayName = profile.displayName || username

  // Stream the response
  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are ${displayName}'s AI Brain — a personal AI assistant that answers questions based on their published notes. Answer helpfully and concisely. If the answer isn't in the notes, say so honestly. When relevant, mention which note the info came from by its title.`,
    messages: [
      {
        role: 'user',
        content: `Here are ${displayName}'s published notes:\n\n${notesContext}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
