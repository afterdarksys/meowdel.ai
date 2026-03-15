import { NextResponse } from 'next/server';

// This timestamp is generated at BUILD time, not runtime
const BUILD_TIME = new Date().toISOString();
const BUILD_VERSION = Date.now();

export async function GET() {
  try {
    return NextResponse.json({
      buildTime: BUILD_TIME,
      buildVersion: BUILD_VERSION,
      currentTime: new Date().toISOString(),
      message: 'This endpoint was built and deployed successfully!'
    });
  } catch (error: any) {
    console.error('[push_date] Error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve build information'
    }, { status: 500 });
  }
}
