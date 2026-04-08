import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const KEY_PREFIX = 'mwdl_'

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function generateKey(): { key: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const key = `${KEY_PREFIX}${raw}`
  return { key, prefix: key.slice(0, 12), hash: hashKey(key) }
}

// GET — list the user's API keys (never returns full key, only prefix + metadata)
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      lastUsedAt: apiKeys.lastUsedAt,
      usageCount: apiKeys.usageCount,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(apiKeys.createdAt)

  return NextResponse.json(keys)
}

// POST — create a new API key
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, permissions = ['chat', 'brain:read'], expiresInDays } = await req.json()

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Key name required' }, { status: 400 })
  }

  // Cap at 10 keys per user
  const existing = await db.select({ id: apiKeys.id }).from(apiKeys).where(eq(apiKeys.userId, user.id))
  if (existing.length >= 10) {
    return NextResponse.json({ error: 'Maximum of 10 API keys per account' }, { status: 400 })
  }

  const { key, prefix, hash } = generateKey()

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000)
    : null

  const [created] = await db.insert(apiKeys).values({
    userId: user.id,
    name: name.trim(),
    keyHash: hash,
    keyPrefix: prefix,
    permissions,
    expiresAt,
  }).returning({ id: apiKeys.id, createdAt: apiKeys.createdAt })

  // Return the raw key ONCE — it cannot be recovered after this response
  return NextResponse.json({
    id: created.id,
    name: name.trim(),
    key,           // shown once only
    keyPrefix: prefix,
    permissions,
    expiresAt,
    createdAt: created.createdAt,
  }, { status: 201 })
}

// DELETE — revoke a key
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const deleted = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
    .returning({ id: apiKeys.id })

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
