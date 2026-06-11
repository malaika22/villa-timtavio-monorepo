import { NextResponse } from 'next/server';

import { config } from '@/config/config';
import { Auth0Client } from '@auth0/nextjs-auth0/server';

const NS = 'https://villatimtavio.com';

function getRolesFromUser(user: Record<string, unknown> | undefined): string[] {
  if (!user) return [];
  return (user[`${NS}/roles`] as string[]) || [];
}

function isDashboardUser(roles: string[]): boolean {
  return roles.includes('estate_manager') || roles.includes('owner');
}

function enrichSessionUser(
  user: Record<string, unknown>,
  roles: string[],
): Record<string, unknown> {
  return {
    ...user,
    role: roles.includes('owner') ? 'owner' : 'estate_manager',
    isOwner: roles.includes('owner'),
    isEM: roles.includes('estate_manager'),
  };
}

if (!config.auth0.clientId || !config.auth0.clientSecret) {
  console.error(
    '[Auth0] Missing AUTH0_CLIENT_ID or AUTH0_CLIENT_SECRET — token exchange will fail.',
  );
}

export const auth0 = new Auth0Client({
  domain: config.auth0.domain!,
  clientId: config.auth0.clientId,
  clientSecret: config.auth0.clientSecret,
  secret: process.env.AUTH0_SECRET,

  appBaseUrl: config.baseURL,
  signInReturnToPath: '/',
  httpTimeout: 30_000,

  authorizationParameters: {
    audience: config.auth0.audience,
    scope: config.auth0.scope,
    prompt: 'login',
  },

  session: {
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
    rolling: true,
    absoluteDuration: 8 * 60 * 60, // 8 hours
  },

  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
  },

  onCallback: async (error, ctx, session) => {
    const baseUrl = ctx.appBaseUrl ?? config.baseURL;

    if (error) {
      const oauthCause = (
        error as { cause?: { code?: string; message?: string } }
      ).cause;
      console.error('[Auth0] Callback error:', {
        code: error.code,
        message: error.message,
        oauthError: oauthCause?.code,
        oauthDescription: oauthCause?.message,
      });

      const message = error.message ?? '';
      if (message.includes('ACCESS_DENIED')) {
        return NextResponse.redirect(new URL('/unauthorized', baseUrl));
      }

      const oauthCode = oauthCause?.code ?? 'unknown';
      return NextResponse.redirect(
        new URL(`/login?error=auth_failed&reason=${oauthCode}`, baseUrl),
      );
    }

    const roles = getRolesFromUser(session?.user as Record<string, unknown>);
    if (!isDashboardUser(roles)) {
      return NextResponse.redirect(new URL('/unauthorized', baseUrl));
    }

    const returnTo = ctx.returnTo || '/';
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  },

  beforeSessionSaved: async (session) => {
    const roles = getRolesFromUser(session.user as Record<string, unknown>);

    session.user = enrichSessionUser(
      session.user as Record<string, unknown>,
      roles,
    ) as typeof session.user;

    return session;
  },
});
