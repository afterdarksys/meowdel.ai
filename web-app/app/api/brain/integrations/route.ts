/**
 * Integrations CRUD
 *
 * GET  /api/brain/integrations           — list user's configured integrations
 * POST /api/brain/integrations           — save/update an integration token
 * DELETE /api/brain/integrations?id=     — remove an integration
 *
 * Supported providers: notion | github | slack | youtube
 *
 * Tier: pro (notion_import, github_sync, etc.)
 *
 * IMPORTANT: In production, encrypt accessToken at rest using a KMS or
 * a symmetric key stored in env. The current implementation stores plaintext
 * which is acceptable for an MVP but must be hardened before going to prod.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { integrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can, type Feature } from '@/lib/features'

export const dynamic = 'force-dynamic'

const PROVIDER_FEATURES: Record<string, Feature> = {
  notion: 'notion_import',
  github: 'github_sync',
  rss: 'rss_feeds',
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      id: integrations.id,
      provider: integrations.provider,
      isActive: integrations.isActive,
      lastSyncAt: integrations.lastSyncAt,
      syncedCount: integrations.syncedCount,
      config: integrations.config,
      // Never return raw tokens to the client
    })
    .from(integrations)
    .where(eq(integrations.userId, user.id))

  // Mask to show only whether a token is configured
  const masked = rows.map((r) => ({
    ...r,
    hasToken: true, // If row exists, assume token is saved
  }))

  return NextResponse.json({ integrations: masked })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, accessToken, config = {} } = await req.json()

  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })

  const requiredFeature = PROVIDER_FEATURES[provider]
  if (requiredFeature && !can(user.subscriptionTier, requiredFeature)) {
    return NextResponse.json({ error: `${provider} integration requires Pro` }, { status: 403 })
  }

  const [row] = await db
    .insert(integrations)
    .values({
      userId: user.id,
      provider,
      accessToken: accessToken ?? null,
      config,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [integrations.userId, integrations.provider],
      set: {
        accessToken: accessToken ?? undefined,
        config,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: integrations.id })

  return NextResponse.json({ success: true, id: row.id })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db
    .delete(integrations)
    .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))

  return NextResponse.json({ success: true })
}
