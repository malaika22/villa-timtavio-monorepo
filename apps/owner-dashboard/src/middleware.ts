import { NextResponse, type NextRequest } from 'next/server';

import { config as appConfig } from '@/config/config';
import { auth0 } from '@/lib/auth0';

const NS = appConfig.auth0.auth0Namespace;

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
  '/unauthorized',
  '/error',
  '/_next',
  '/favicon',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth0 handles login/callback/logout/profile + rolling session refresh.
  const authResponse = await auth0.middleware(request);

  if (pathname.startsWith('/api/auth')) {
    return authResponse;
  }

  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return authResponse;
  }

  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      // Send unauthenticated visitors to the app's own sign-in screen rather
      // than straight out to Auth0 — matching the estate manager dashboard,
      // and keeping this redirect same-origin so route prefetches don't try to
      // load an external /authorize URL from a subframe.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const roles: string[] = (session.user[`${NS}/roles`] as string[]) || [];
    if (!roles.includes('owner')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return authResponse;
  } catch (error) {
    console.error(error);
    const loginUrl = new URL('/api/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|icons).*)',
  ],
};
