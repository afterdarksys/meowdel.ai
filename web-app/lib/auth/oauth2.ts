/**
 * OAuth2 Integration with After Dark Systems SSO
 * Handles authentication flow for meowdel.ai users via Authentik
 */

export interface OAuth2Config {
  providerUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface OAuth2TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface OAuth2UserInfo {
  sub: string // User ID from SSO
  email: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  phone_number?: string
  email_verified?: boolean
  phone_number_verified?: boolean
}

export class OAuth2Client {
  private config: OAuth2Config

  constructor() {
    this.config = {
      providerUrl: process.env.OAUTH2_PROVIDER_URL || 'https://afterdarktech.com/oauth2',
      clientId: process.env.OAUTH2_CLIENT_ID || '',
      clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
      redirectUri: process.env.OAUTH2_REDIRECT_URI || '',
      scopes: (process.env.OAUTH2_SCOPES || 'openid profile email').split(' '),
    }
  }

  private validateConfig() {
    // Validate configuration only when actually used
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('OAuth2 configuration missing. Set OAUTH2_CLIENT_ID and OAUTH2_CLIENT_SECRET')
    }
  }

  /**
   * Generate authorization URL for OAuth2 login
   */
  getAuthorizationUrl(state: string): string {
    this.validateConfig()
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
    })

    // Authentik uses /authorize endpoint
    return `${this.config.providerUrl}/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<OAuth2TokenResponse> {
    this.validateConfig()
    const response = await fetch(`${this.config.providerUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[OAuth2] Token exchange failed:', error)
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get user information from access token
   */
  async getUserInfo(accessToken: string): Promise<OAuth2UserInfo> {
    const response = await fetch(`${this.config.providerUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[OAuth2] Failed to get user info:', error)
      throw new Error(`Failed to get user info: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuth2TokenResponse> {
    const response = await fetch(`${this.config.providerUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[OAuth2] Token refresh failed:', error)
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Revoke access token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch(`${this.config.providerUrl}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.clientId}:${this.config.clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        token,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[OAuth2] Token revocation failed:', error)
      // Don't throw - best effort revocation
    }
  }
}

export const oauth2Client = new OAuth2Client()
