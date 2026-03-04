/**
 * Cat Personality Persistence API
 * Save and retrieve cat personality data
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CatPersonalityProfile } from '@/types/browserid';
import { updateCatPersonality, getBrowserIDUser } from '@/lib/db/browserid.service';

export async function POST(request: NextRequest) {
  try {
    const { browserID, personality } = await request.json();

    if (!browserID || !personality) {
      return NextResponse.json(
        { error: 'BrowserID and personality required' },
        { status: 400 }
      );
    }

    // Update personality in database
    const updatedPersonality = await updateCatPersonality(browserID, personality);

    return NextResponse.json({
      success: true,
      personality: updatedPersonality,
      message: 'Personality updated successfully'
    });
  } catch (error) {
    console.error('Personality update error:', error);

    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found. Call /api/browserid/identify first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update personality' },
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
      personality: user.catPersonality
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'User not found'
    }, { status: 404 });
  }
}
