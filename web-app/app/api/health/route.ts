/**
 * Health Check API Endpoint
 * Used by Kubernetes liveness and readiness probes
 */

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startTime = Date.now();

    // Test database connection with simple query
    await db.execute(sql`SELECT 1 as health_check`);

    const dbLatency = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
