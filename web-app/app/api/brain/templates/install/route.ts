/**
 * POST /api/brain/templates/install
 * Body: { templateId: string }
 *
 * Creates a new Brain note from a template and increments the install count.
 * Available to all logged-in users (browsing and installing is free).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { noteTemplates, brainNotes, agentJobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { templateId } = await req.json()
  if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

  const [template] = await db
    .select()
    .from(noteTemplates)
    .where(eq(noteTemplates.id, templateId))
    .limit(1)

  if (!template || !template.isPublished) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const slug =
    template.slug.replace(/-[\w]+$/, '') + // strip trailing id
    '-' + Date.now().toString(36)

  const wordCount = template.content.trim().split(/\s+/).length

  const [note] = await db
    .insert(brainNotes)
    .values({
      userId: user.id,
      slug,
      title: template.title,
      content: template.content,
      tags: template.tags ?? [],
      wordCount,
      frontmatter: { template: template.id, templateSlug: template.slug },
    })
    .returning({ id: brainNotes.id, slug: brainNotes.slug })

  // Increment install count (best effort)
  await db
    .update(noteTemplates)
    .set({ installCount: (template.installCount ?? 0) + 1 })
    .where(eq(noteTemplates.id, template.id))

  await db.insert(agentJobs).values({
    userId: user.id,
    jobType: 'embed_note',
    agentName: 'embedder',
    payload: { noteId: note.id },
    priority: 8,
  })

  return NextResponse.json({ success: true, id: note.id, slug: note.slug, title: template.title })
}
