import { NextRequest, NextResponse } from 'next/server'
import { oauth2Client } from '@/lib/auth/oauth2'
import { applyEmployeeBenefits, isAfterDarkEmployee } from '@/lib/auth/employee-detection'
import { linkBrowserIDToOAuth, getBrowserIDUser } from '@/lib/db/browserid.service'

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

    // Link OAuth account to BrowserID
    await linkBrowserIDToOAuth(
      browserIDCookie,
      'adsas',
      userInfo.sub,
      userInfo.email,
      userInfo.name
    )

    // Get updated user
    const user = await getBrowserIDUser(browserIDCookie)

    console.log('[OAuth2] OAuth account linked successfully')

    // Note: Employee benefits and subscription tiers need to be implemented in the schema
    if (isAfterDarkEmployee(userInfo.email)) {
      console.log('[OAuth2] Employee benefits should be granted:', userInfo.email)
      // TODO: Implement subscription tier updates in schema
    }

    // Redirect back to homepage with success
    const response = NextResponse.redirect(new URL('/?login=success', request.url))

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state')

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
