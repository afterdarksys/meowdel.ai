/**
 * Next.js Middleware for Rate Limiting and Security
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// For production, consider using Redis for distributed rate limiting
const rateLimit = new Map<string, { count: number; reset: number }>();

// Configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const API_RATE_LIMIT_MAX_REQUESTS = 20; // 20 API requests per minute

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (value.reset < now) {
      rateLimit.delete(key);
    }
  }
}, 300000);

function getRateLimitKey(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] ?? realIp ?? 'unknown';

  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(request: NextRequest, maxRequests: number): { allowed: boolean; limit: number; remaining: number; reset: number } {
  const key = getRateLimitKey(request);
  const now = Date.now();

  const limitData = rateLimit.get(key);

  if (!limitData || limitData.reset < now) {
    // New window
    const reset = now + RATE_LIMIT_WINDOW;
    rateLimit.set(key, { count: 1, reset });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset,
    };
  }

  // Within existing window
  if (limitData.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      reset: limitData.reset,
    };
  }

  limitData.count++;

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - limitData.count,
    reset: limitData.reset,
  };
}

export function middleware(request: NextRequest) {
  // Determine rate limit based on path
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const maxRequests = isApiRoute ? API_RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;

  // Check rate limit
  const { allowed, limit, remaining, reset } = checkRateLimit(request, maxRequests);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  // --- Authentication Check ---
  const protectedPaths = ['/profile', '/chat']; // Add protected routes here
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected) {
    const token = request.cookies.get('oauth_token')?.value
    if (!token) {
      const loginUrl = new URL('/api/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  // ----------------------------

  return response;
}

export const config = {
  matcher: [
    // Apply to API routes
    '/api/:path*',
    // Exclude static files and internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
