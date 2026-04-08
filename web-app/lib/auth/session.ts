import { cookies, headers } from 'next/headers'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { users, browseridUsers, apiKeys } from '@/lib/db/schema'
import { eq, and, or, isNull, gt } from 'drizzle-orm'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  subscriptionTier: string
  role: string
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  team: 2,
  enterprise: 3,
}

export function tierAtLeast(userTier: string, requiredTier: string): boolean {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0)
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    // 1. Check for API key in Authorization: Bearer header
    const headerStore = await headers()
    const authorization = headerStore.get('authorization')
    if (authorization?.startsWith('Bearer mwdl_')) {
      const rawKey = authorization.slice(7)
      const keyHash = createHash('sha256').update(rawKey).digest('hex')

      const [keyRow] = await db
        .select({ userId: apiKeys.userId })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyHash, keyHash),
            or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date()))
          )
        )
        .limit(1)

      if (keyRow?.userId) {
        // Bump usage count (fire and forget)
        db.update(apiKeys)
          .set({ lastUsedAt: new Date(), usageCount: db.$count(apiKeys) })
          .where(eq(apiKeys.keyHash, keyHash))
          .catch(() => {})

        const [user] = await db
          .select({ id: users.id, email: users.email, name: users.name, subscriptionTier: users.subscriptionTier, role: users.role })
          .from(users)
          .where(eq(users.id, keyRow.userId))
          .limit(1)
        if (user) return user
      }
    }

    // 2. Fall back to browser_id cookie
    const cookieStore = await cookies()
    const browserIdCookie = cookieStore.get('browser_id')?.value
    if (!browserIdCookie) return null

    const [browserUser] = await db
      .select({ userId: browseridUsers.userId })
      .from(browseridUsers)
      .where(eq(browseridUsers.browserID, browserIdCookie))
      .limit(1)

    if (!browserUser?.userId) return null

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, subscriptionTier: users.subscriptionTier, role: users.role })
      .from(users)
      .where(eq(users.id, browserUser.userId))
      .limit(1)

    return user ?? null
  } catch {
    return null
  }
}

// For use in API routes where cookies() is available server-side
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')
  return user
}
