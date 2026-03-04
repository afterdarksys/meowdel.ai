/**
 * BrowserID Identification Endpoint
 * Checks if a BrowserID is known and returns user data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateBrowserIDUser, getBrowserIDUser } from '@/lib/db/browserid.service';

export async function POST(request: NextRequest) {
  try {
    const { browserID, components } = await request.json();

    if (!browserID) {
      return NextResponse.json(
        { error: 'BrowserID required' },
        { status: 400 }
      );
    }

    // Get or create user in database
    const userData = await getOrCreateBrowserIDUser(browserID);

    return NextResponse.json({
      success: true,
      known: userData.known,
      user: {
        browserID: userData.browserID,
        catPersonality: userData.catPersonality,
        firstSeen: userData.firstSeen.toISOString(),
        lastSeen: userData.lastSeen.toISOString(),
        sessionCount: userData.sessionCount,
        linkedBrowserIDs: userData.linkedBrowserIDs,
        email: 'email' in userData ? userData.email : null,
        name: 'name' in userData ? userData.name : null,
        oauthProvider: 'oauthProvider' in userData ? userData.oauthProvider : null,
        oauthLinkedAt: 'oauthLinkedAt' in userData && userData.oauthLinkedAt ? userData.oauthLinkedAt.toISOString() : null,
      },
      message: userData.known
        ? `Welcome back! Session #${userData.sessionCount}`
        : 'New user created! Welcome to Meowdel!'
    });
  } catch (error) {
    console.error('BrowserID identify error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const browserID = searchParams.get('browserID');

  if (!browserID) {
    return NextResponse.json(
      { error: 'BrowserID required' },
      { status: 400 }
    );
  }

  const user = await getBrowserIDUser(browserID);

  if (user) {
    return NextResponse.json({
      success: true,
      user: {
        browserID: user.browserID,
        catPersonality: user.catPersonality,
        firstSeen: user.firstSeen.toISOString(),
        lastSeen: user.lastSeen.toISOString(),
        sessionCount: user.sessionCount,
        linkedBrowserIDs: user.linkedBrowserIDs,
        email: user.email ?? null,
        name: user.name ?? null,
        oauthProvider: user.oauthProvider ?? null,
        oauthLinkedAt: user.oauthLinkedAt?.toISOString() ?? null,
      }
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'User not found'
    }, { status: 404 });
  }
}
