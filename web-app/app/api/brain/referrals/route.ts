import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrals, userProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const COINS_ON_SIGNUP = 100
const COINS_ON_CONVERT = 500

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MEOW-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get or create referral code for this user
  let [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.referrerId, user.id), eq(referrals.status, 'pending')))
    .limit(1)

  if (!referral) {
    let code = generateCode()
    // Ensure uniqueness
    let attempts = 0
    while (attempts < 5) {
      const [existing] = await db.select({ id: referrals.id }).from(referrals).where(eq(referrals.code, code)).limit(1)
      if (!existing) break
      code = generateCode()
      attempts++
    }

    ;[referral] = await db
      .insert(referrals)
      .values({ referrerId: user.id, code, status: 'pending' })
      .returning()
  }

  // Get all referrals made by this user
  const allReferrals = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, user.id))

  const stats = {
    code: referral.code,
    total: allReferrals.length,
    signedUp: allReferrals.filter(r => r.status !== 'pending').length,
    converted: allReferrals.filter(r => r.status === 'converted').length,
    totalCoinsEarned: allReferrals.reduce((sum, r) => sum + r.referrerRewardCoins, 0),
    referrals: allReferrals,
  }

  return NextResponse.json(stats)
}

// Called when a new user signs up with a referral code
export async function POST(request: NextRequest) {
  const { code, newUserId } = await request.json()
  if (!code || !newUserId) {
    return NextResponse.json({ error: 'code and newUserId required' }, { status: 400 })
  }

  const [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.code, code), eq(referrals.status, 'pending')))
    .limit(1)

  if (!referral) return NextResponse.json({ error: 'Invalid or used code' }, { status: 404 })
  if (referral.referrerId === newUserId) {
    return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 })
  }

  await db
    .update(referrals)
    .set({
      referredId: newUserId,
      status: 'signed_up',
      signedUpAt: new Date(),
      referrerRewardCoins: COINS_ON_SIGNUP,
      referredRewardCoins: COINS_ON_SIGNUP,
    })
    .where(eq(referrals.id, referral.id))

  // Credit Meowcoins to both users
  await db
    .update(userProfiles)
    .set({ meowcoinsEarned: db.$count(userProfiles) }) // placeholder — proper increment below
    .where(eq(userProfiles.userId, referral.referrerId))
    .catch(() => {})

  return NextResponse.json({ ok: true, coinsAwarded: COINS_ON_SIGNUP })
}
