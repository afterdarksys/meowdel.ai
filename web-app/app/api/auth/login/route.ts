import { NextRequest, NextResponse } from 'next/server'
import { oauth2Client } from '@/lib/auth/oauth2'
import { randomBytes } from 'crypto'

// Force dynamic rendering to avoid build-time OAuth2 config requirement
export const dynamic = 'force-dynamic'

/**
 * OAuth2 Login Initiation
 * Redirects user to After Dark Systems SSO (Authentik)
 */
export async function GET(request: NextRequest) {
  try {
    // Generate secure state parameter to prevent CSRF
    const state = randomBytes(32).toString('hex')

    // Store state in cookie for verification on callback
    const response = NextResponse.redirect(oauth2Client.getAuthorizationUrl(state))

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    console.log('[OAuth2] Redirecting to SSO login')

    return response
  } catch (error) {
    console.error('[OAuth2] Login error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 }
    )
  }
}
