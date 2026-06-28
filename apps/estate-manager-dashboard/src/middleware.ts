import { NextResponse, type NextRequest } from 'next/server';

import { config as appConfig } from '@/config/config';
import { auth0 } from '@/lib/auth0';

const NS = appConfig.auth0.auth0Namespace ?? 'https://villatimtavio.com';

const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
  '/unauthorized',
  '/error',
  '/_next',
  '/favicon',
];

const OWNER_ONLY_ROUTES = [
  '/overview',
  '/heat-maps',
  '/analytics',
  '/experiences',
  '/capital-insights',
  '/system-health',
];

const EM_ONLY_ROUTES = [
  '/',
  '/dashboard',
  '/approvals',
  '/bookings',
  '/guests',
  '/inquiries',
  '/calendar',
  '/reports',
  '/content',
  '/menu',
  '/vendors',
  '/folio',
  '/inventory',
  '/settings',
  '/audit-log',
];

function matchesRoute(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
}

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => matchesRoute(pathname, route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth0 handles login/callback/logout and rolling session refresh
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
      const loginUrl = new URL('/api/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const roles: string[] = (session.user[`${NS}/roles`] as string[]) || [];
    const isOwner = roles.includes('owner');
    const isEM = roles.includes('estate_manager');

    if (!isOwner && !isEM) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Owner (without EM) trying to access EM-only routes
    if (isOwner && !isEM && matchesAny(pathname, EM_ONLY_ROUTES)) {
      return NextResponse.redirect(new URL('/overview', request.url));
    }

    // EM (without owner) trying to access owner-only routes
    if (isEM && !isOwner && matchesAny(pathname, OWNER_ONLY_ROUTES)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Root — redirect to role-appropriate landing
    if (pathname === '/') {
      if (isOwner) {
        return NextResponse.redirect(new URL('/overview', request.url));
      }
      return authResponse;
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
