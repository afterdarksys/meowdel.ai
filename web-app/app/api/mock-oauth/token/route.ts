import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * MOCK OAuth2 /token Endpoint
 * Exchanges the auth code for access/refresh tokens.
 */
export async function POST(request: NextRequest) {
    console.log('[Mock OAuth] Exchanging code for token...')

    return NextResponse.json({
        access_token: 'mock_access_token_abc123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh_token_xyz789',
        scope: 'openid profile email'
    })
}
