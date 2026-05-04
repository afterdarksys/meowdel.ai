import { NextRequest, NextResponse } from 'next/server'
import { oauth2Client } from '@/lib/auth/oauth2'
import { applyEmployeeBenefits, isAfterDarkEmployee } from '@/lib/auth/employee-detection'
import { linkBrowserIDToOAuth, getBrowserIDUser } from '@/lib/db/browserid.service'
import { db } from '@/lib/db'
import { referrals, userProfiles, users } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// Force dynamic rendering to avoid build-time OAuth2 config requirement
export const dynamic = 'force-dynamic'

/**
 * OAuth2 Callback Handler
 * Receives authorization code from After Dark Systems SSO
 * and links it to the user's BrowserID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth2 error response
    if (error) {
      console.error('[OAuth2] Authorization error:', error)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[OAuth2] Missing code or state parameter')
      return NextResponse.redirect(
        new URL('/?error=invalid_request', request.url)
      )
    }

    // Verify state parameter (CSRF protection)
    const savedState = request.cookies.get('oauth_state')?.value
    if (!savedState || savedState !== state) {
      console.error('[OAuth2] State mismatch - possible CSRF attack')
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      )
    }

    // Exchange code for access token
    const tokenResponse = await oauth2Client.exchangeCodeForToken(code)

    // Get user info from SSO
    const userInfo = await oauth2Client.getUserInfo(tokenResponse.access_token)

    console.log('[OAuth2] User authenticated:', {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
    })

    // Apply employee benefits if user is After Dark employee
    const enhancedUserInfo = applyEmployeeBenefits({
      email: userInfo.email,
      oauthSub: userInfo.sub,
      name: userInfo.name,
      picture: userInfo.picture,
    })

    // Get BrowserID from cookie
    const browserIDCookie = request.cookies.get('browser_id')?.value

    if (!browserIDCookie) {
      console.error('[OAuth2] No BrowserID cookie found')
      return NextResponse.redirect(
        new URL('/?error=no_browser_id', request.url)
      )
    }

    // Extract employee benefits for persistence (use type guard for TypeScript)
    const employeeBenefits = 'subscriptionTier' in enhancedUserInfo ? {
      subscriptionTier: enhancedUserInfo.subscriptionTier,
      subscriptionStatus: enhancedUserInfo.subscriptionStatus,
      role: enhancedUserInfo.role,
      isAfterDarkEmployee: enhancedUserInfo.isAfterDarkEmployee,
      employeeDomain: enhancedUserInfo.employeeDomain,
    } : undefined;

    // Link OAuth account to BrowserID with employee benefits
    await linkBrowserIDToOAuth(
      browserIDCookie,
      'adsas',
      userInfo.sub,
      userInfo.email,
      userInfo.name,
      employeeBenefits
    )

    // Get updated user
    const user = await getBrowserIDUser(browserIDCookie)

    // Process referral code if present (only for brand-new users, i.e. created in last 60s)
    const refCode = request.cookies.get('referral_code')?.value
    let isNewUser = false
    if (refCode && user?.userId) {
      const [dbUser] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, user.userId)).limit(1)
      isNewUser = !!dbUser && (Date.now() - new Date(dbUser.createdAt).getTime()) < 60_000
    }
    if (refCode && user?.userId && isNewUser) {
      try {
        const [referral] = await db
          .select()
          .from(referrals)
          .where(and(eq(referrals.code, refCode), eq(referrals.status, 'pending')))
          .limit(1)

        if (referral && referral.referrerId !== user.userId) {
          await db
            .update(referrals)
            .set({
              referredId: user.userId,
              status: 'signed_up',
              signedUpAt: new Date(),
              referrerRewardCoins: 100,
              referredRewardCoins: 100,
            })
            .where(eq(referrals.id, referral.id))

          // Credit Meowcoins to both users
          await db
            .update(userProfiles)
            .set({ meowcoinsEarned: sql`${userProfiles.meowcoinsEarned} + 100` })
            .where(eq(userProfiles.userId, referral.referrerId))
            .catch(() => {})

          await db
            .update(userProfiles)
            .set({ meowcoinsEarned: sql`${userProfiles.meowcoinsEarned} + 100` })
            .where(eq(userProfiles.userId, user.userId))
            .catch(() => {})
        }
      } catch {
        // Referral errors are non-fatal
      }
    }

    console.log('[OAuth2] OAuth account linked successfully')

    if ('subscriptionTier' in enhancedUserInfo) {
      console.log('[OAuth2] Employee benefits granted:', {
        email: userInfo.email,
        tier: enhancedUserInfo.subscriptionTier,
        domain: enhancedUserInfo.employeeDomain
      })
    }

    // Redirect back to homepage with success
    const response = NextResponse.redirect(new URL('/?login=success', request.url))

    // Clear OAuth state and referral cookies
    response.cookies.delete('oauth_state')
    response.cookies.delete('referral_code')

    // Set user session cookie
    response.cookies.set('oauth_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in,
      path: '/',
    })

    if (tokenResponse.refresh_token) {
      response.cookies.set('oauth_refresh', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('[OAuth2] Callback error:', error)
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    )
  }
}
