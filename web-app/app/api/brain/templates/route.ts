/**
 * Note Templates Marketplace
 *
 * GET  /api/brain/templates           — browse published templates (with optional ?category=)
 * POST /api/brain/templates           — publish a new template (pro)
 * GET  /api/brain/templates?mine=true — list user's own templates
 *
 * POST /api/brain/templates/install   — install a template as a new note
 *
 * Tier: browsing = free; publishing = pro (templates_marketplace)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { noteTemplates, users } from '@/lib/db/schema'
import { eq, desc, and, ilike, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const mine = searchParams.get('mine') === 'true'
  const search = searchParams.get('q')

  const user = await getSession()

  let query = db
    .select({
      id: noteTemplates.id,
      slug: noteTemplates.slug,
      title: noteTemplates.title,
      description: noteTemplates.description,
      tags: noteTemplates.tags,
      category: noteTemplates.category,
      installCount: noteTemplates.installCount,
      rating: noteTemplates.rating,
      createdAt: noteTemplates.createdAt,
      authorId: noteTemplates.authorId,
      // Exclude raw content from list to keep payload small
    })
    .from(noteTemplates)
    .$dynamic()

  if (mine && user) {
    query = query.where(eq(noteTemplates.authorId, user.id))
  } else {
    query = query.where(eq(noteTemplates.isPublished, true))
  }

  if (category) {
    query = query.where(eq(noteTemplates.category, category))
  }

  if (search) {
    query = query.where(
      sql`(${noteTemplates.title} ILIKE ${`%${search}%`} OR ${noteTemplates.description} ILIKE ${`%${search}%`})`
    )
  }

  const templates = await query.orderBy(desc(noteTemplates.installCount)).limit(50)

  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'templates_marketplace')) {
    return NextResponse.json({ error: 'Publishing templates requires Pro' }, { status: 403 })
  }

  const { title, description, content, tags = [], category, isPublished = false } = await req.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const slug =
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) +
    '-' + Date.now().toString(36)

  const [template] = await db
    .insert(noteTemplates)
    .values({
      authorId: user.id,
      title,
      slug,
      description,
      content,
      tags,
      category,
      isPublished,
    })
    .returning({ id: noteTemplates.id, slug: noteTemplates.slug })

  return NextResponse.json({ success: true, id: template.id, slug: template.slug })
}
