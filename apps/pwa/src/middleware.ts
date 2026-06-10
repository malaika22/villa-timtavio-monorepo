import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/callback', '/link-expired', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check protected paths
  const isProtected =
    pathname.startsWith('/home') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/folio') ||
    pathname.startsWith('/status') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/requests');

  if (!isProtected) return NextResponse.next();

  // Middleware cannot read sessionStorage (client-only)
  // Use a short-lived cookie set on token exchange instead
  const hasSession = request.cookies.has('auth_session');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/link-expired', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home/:path*',
    '/explore/:path*',
    '/folio/:path*',
    '/status/:path*',
    '/manifest/:path*',
    '/requests/:path*',
  ],
};
