import { NextRequest, NextResponse } from 'next/server'
import { oauth2Client } from '@/lib/auth/oauth2'

export const dynamic = 'force-dynamic'

/**
 * OAuth2 Logout
 * Revokes the access token and clears local session cookies
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('oauth_token')?.value

        if (token) {
            // Try to revoke the token on the SSO provider (best effort)
            await oauth2Client.revokeToken(token)
        }

        const response = NextResponse.redirect(new URL('/', request.url))

        // Clear session cookies
        response.cookies.delete('oauth_token')
        response.cookies.delete('oauth_refresh')
        response.cookies.delete('oauth_state')

        console.log('[OAuth2] User logged out successfully')

        return response
    } catch (error) {
        console.error('[OAuth2] Logout error:', error)
        // Always redirect home even if revocation fails
        return NextResponse.redirect(new URL('/', request.url))
    }
}
