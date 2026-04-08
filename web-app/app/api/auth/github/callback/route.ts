import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, browseridUsers, browseridOauthMappings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

async function getGitHubUser(accessToken: string): Promise<{ user: GitHubUser; email: string }> {
  const [userRes, emailsRes] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'meowdel.ai' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'meowdel.ai' },
    }),
  ])

  if (!userRes.ok) throw new Error(`GitHub user fetch failed: ${userRes.status}`)

  const user: GitHubUser = await userRes.json()
  let email = user.email ?? ''

  if (!email && emailsRes.ok) {
    const emails: GitHubEmail[] = await emailsRes.json()
    const primary = emails.find(e => e.primary && e.verified)
    email = primary?.email ?? emails[0]?.email ?? ''
  }

  return { user, email }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = new URL('/', request.url)

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=invalid_request', request.url))
  }

  const savedState = request.cookies.get('github_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=not_configured', request.url))
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })

    if (!tokenRes.ok) throw new Error('Token exchange failed')
    const { access_token } = await tokenRes.json()

    // Get user info
    const { user: ghUser, email } = await getGitHubUser(access_token)

    if (!email) throw new Error('No verified email on GitHub account')

    const githubSub = String(ghUser.id)

    // Upsert user in our DB
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.oauthSub, githubSub), eq(users.oauthProvider, 'github')))
      .limit(1)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      await db.update(users)
        .set({ name: ghUser.name, avatarUrl: ghUser.avatar_url, lastLoginAt: new Date() })
        .where(eq(users.id, userId))
    } else {
      // Check if email already exists (merge accounts)
      const [emailUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (emailUser) {
        userId = emailUser.id
        // Link GitHub to existing account
        await db.update(users)
          .set({ oauthSub: githubSub, oauthProvider: 'github', avatarUrl: ghUser.avatar_url, lastLoginAt: new Date() })
          .where(eq(users.id, userId))
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: ghUser.name ?? ghUser.login,
            oauthSub: githubSub,
            oauthProvider: 'github',
            avatarUrl: ghUser.avatar_url,
            subscriptionTier: 'free',
            lastLoginAt: new Date(),
          })
          .returning({ id: users.id })

        userId = newUser.id
      }
    }

    // Link to BrowserID if present
    const browserIdCookie = request.cookies.get('browser_id')?.value
    if (browserIdCookie) {
      await db
        .update(browseridUsers)
        .set({ userId, oauthProvider: 'github', oauthLinkedAt: new Date() })
        .where(eq(browseridUsers.browserID, browserIdCookie))
        .catch(console.error)

      await db
        .insert(browseridOauthMappings)
        .values({ oauthProvider: 'github', oauthUserId: githubSub, browserID: browserIdCookie })
        .onConflictDoNothing()
        .catch(console.error)
    }

    const response = NextResponse.redirect(new URL('/?login=success', request.url))
    response.cookies.delete('github_oauth_state')

    // Set session cookie (use github access token as session marker, httpOnly)
    response.cookies.set('oauth_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[GitHub OAuth] Callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
