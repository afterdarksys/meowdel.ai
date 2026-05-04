import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { outboundWebhooks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const VALID_EVENTS = ['note.created', 'note.updated', 'note.deleted', 'note.published', 'note.tagged']

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const webhooks = await db
    .select()
    .from(outboundWebhooks)
    .where(eq(outboundWebhooks.userId, user.id))
    .orderBy(outboundWebhooks.createdAt)

  return NextResponse.json(webhooks)
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, url, events, secret: providedSecret } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'At least one event is required' }, { status: 400 })
  }
  const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e))
  if (invalidEvents.length > 0) {
    return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(', ')}` }, { status: 400 })
  }

  const secret = providedSecret || randomBytes(24).toString('hex')

  const [webhook] = await db
    .insert(outboundWebhooks)
    .values({ userId: user.id, name, url, events, secret })
    .returning()

  return NextResponse.json(webhook, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db
    .delete(outboundWebhooks)
    .where(and(eq(outboundWebhooks.id, id), eq(outboundWebhooks.userId, user.id)))

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, isActive } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const [updated] = await db
    .update(outboundWebhooks)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(outboundWebhooks.id, id), eq(outboundWebhooks.userId, user.id)))
    .returning()

  return NextResponse.json(updated)
}
