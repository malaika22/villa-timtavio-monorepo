import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/auth/callback',
  '/link-expired',
  '/api/auth',
  '/guest-submitted',
];

const PROTECTED_PATHS = [
  '/',
  '/experiences',
  '/status',
  '/folio',
  '/checkout',
  '/rooms',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)),
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has('auth_session');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/link-expired', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|sw.js|workbox-.*).*)',
  ],
};
