import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * MOCK OAuth2 /userinfo Endpoint
 * Returns user profile info for the mock owner.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Mock OAuth] Returning user info...')

    return NextResponse.json({
        sub: 'mock_user_999',
        email: 'ryan@afterdarktech.com', // Recognized as an employee by employee-detection.ts
        name: 'Ryan (Dev)'
    })
}
