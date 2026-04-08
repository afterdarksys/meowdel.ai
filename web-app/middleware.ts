import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes require an active session cookie
const PROTECTED_PATHS = ['/profile', '/chat', '/brain'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  if (isProtected) {
    const token = request.cookies.get('oauth_token')?.value;
    const browserId = request.cookies.get('browser_id')?.value;
    if (!token && !browserId) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
