import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * MOCK OAuth2 /authorize Endpoint
 * In a real environment, this displays a login screen.
 * For our mock, we just immediately redirect back with a fake code.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const redirectUri = searchParams.get('redirect_uri')
    const state = searchParams.get('state')

    if (!redirectUri || !state) {
        return NextResponse.json({ error: 'Missing redirect_uri or state' }, { status: 400 })
    }

    // Simulate a user "logging in" and granting permission
    console.log('[Mock OAuth] Authorizing user and redirecting back...')

    // Send back a fake authorization code
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('code', 'mock_auth_code_12345')
    redirectUrl.searchParams.set('state', state)

    return NextResponse.redirect(redirectUrl)
}
