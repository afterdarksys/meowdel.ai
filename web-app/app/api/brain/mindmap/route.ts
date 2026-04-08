/**
 * Mind Map Data API
 *
 * GET /api/brain/mindmap?noteId=<uuid>
 *
 * Uses Claude to decompose a note into a hierarchical tree of concepts
 * suitable for rendering as a mind map. Returns a tree structure that
 * can be consumed by D3 or react-d3-tree.
 *
 * Tier: mind_map (pro)
 *
 * Frontend package needed: npm install react-d3-tree
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface MindMapNode {
  name: string
  children?: MindMapNode[]
  attributes?: { [key: string]: string }
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'mind_map')) {
    return NextResponse.json({ error: 'Mind maps require Pro' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  const [note] = await db
    .select({ id: brainNotes.id, title: brainNotes.title, content: brainNotes.content, userId: brainNotes.userId })
    .from(brainNotes)
    .where(and(eq(brainNotes.id, noteId), eq(brainNotes.isDeleted, false)))
    .limit(1)

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  if (note.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze the following note and create a mind map tree structure. The root should be the note title. Identify 3-6 main branches (key themes/concepts), and 2-4 sub-concepts per branch. Return ONLY a valid JSON object matching this TypeScript type:
interface MindMapNode { name: string; children?: MindMapNode[] }

No explanation, no code block, just the raw JSON object.

Note title: ${note.title}
Note content:
${note.content.slice(0, 5000)}`,
      },
    ],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'

  let tree: MindMapNode
  try {
    // Extract JSON from response (handle cases where model wraps in backticks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    tree = jsonMatch ? JSON.parse(jsonMatch[0]) : { name: note.title, children: [] }
  } catch {
    tree = { name: note.title, children: [] }
  }

  // Ensure root name is the note title
  tree.name = note.title

  return NextResponse.json({ tree, noteId, title: note.title })
}
