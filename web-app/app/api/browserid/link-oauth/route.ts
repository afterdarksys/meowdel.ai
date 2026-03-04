/**
 * Link BrowserID to OAuth2 Account
 * Enables cross-device sync and persistent authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { linkBrowserIDToOAuth, getLinkedBrowserIDs, getBrowserIDUser } from '@/lib/db/browserid.service';
import { db } from '@/lib/db';
import { browseridUsers } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { browserID, oauthProvider, oauthUserId, email, name } = await request.json();

    if (!browserID || !oauthProvider || !oauthUserId) {
      return NextResponse.json(
        { error: 'BrowserID, oauthProvider, and oauthUserId required' },
        { status: 400 }
      );
    }

    // Link OAuth account and merge personalities across devices
    const result = await linkBrowserIDToOAuth(
      browserID,
      oauthProvider,
      oauthUserId,
      email,
      name
    );

    // Get updated user data
    const user = await getBrowserIDUser(browserID);

    return NextResponse.json({
      success: true,
      user: user ? {
        browserID: user.browserID,
        catPersonality: user.catPersonality,
        firstSeen: user.firstSeen.toISOString(),
        lastSeen: user.lastSeen.toISOString(),
        sessionCount: user.sessionCount,
        linkedBrowserIDs: user.linkedBrowserIDs,
        email: user.email,
        name: user.name,
        oauthProvider: user.oauthProvider,
        oauthLinkedAt: user.oauthLinkedAt?.toISOString(),
      } : null,
      linkedDevices: result.linkedBrowserIDs.length,
      message: `Successfully linked ${result.linkedBrowserIDs.length} device(s)`
    });
  } catch (error) {
    console.error('OAuth link error:', error);

    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found. Call /api/browserid/identify first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to link OAuth account' },
      { status: 500 }
    );
  }
}

/**
 * Get all BrowserIDs linked to an OAuth account
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oauthProvider = searchParams.get('oauthProvider');
  const oauthUserId = searchParams.get('oauthUserId');

  if (!oauthProvider || !oauthUserId) {
    return NextResponse.json(
      { error: 'oauthProvider and oauthUserId required' },
      { status: 400 }
    );
  }

  const linkedBrowserIDs = await getLinkedBrowserIDs(oauthProvider, oauthUserId);

  if (linkedBrowserIDs.length === 0) {
    return NextResponse.json({
      success: true,
      linkedBrowserIDs: [],
      count: 0
    });
  }

  // Get all users for these BrowserIDs
  const users = await db
    .select()
    .from(browseridUsers)
    .where(inArray(browseridUsers.browserID, linkedBrowserIDs));

  return NextResponse.json({
    success: true,
    linkedBrowserIDs,
    count: linkedBrowserIDs.length,
    users: users.map(u => ({
      browserID: u.browserID,
      catPersonality: u.catPersonality,
      firstSeen: u.firstSeen.toISOString(),
      lastSeen: u.lastSeen.toISOString(),
      sessionCount: u.sessionCount,
      linkedBrowserIDs: u.linkedBrowserIDs,
      email: u.email,
      name: u.name,
      oauthProvider: u.oauthProvider,
      oauthLinkedAt: u.oauthLinkedAt?.toISOString(),
    }))
  });
}
