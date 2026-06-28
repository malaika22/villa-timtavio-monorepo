import { NextResponse } from 'next/server';

import { config } from '@/config/config';
import { Auth0Client } from '@auth0/nextjs-auth0/server';

const NS = config.auth0.auth0Namespace;

function getRolesFromUser(user: Record<string, unknown> | undefined): string[] {
  if (!user) return [];
  return (user[`${NS}/roles`] as string[]) || [];
}

// The Owner Intelligence Dashboard is owner-only.
function isOwner(roles: string[]): boolean {
  return roles.includes('owner');
}

if (!config.auth0.clientId || !config.auth0.clientSecret) {
  console.error(
    '[Auth0] Missing AUTH0_CLIENT_ID or AUTH0_CLIENT_SECRET — login will fail.',
  );
}

export const auth0 = new Auth0Client({
  domain: config.auth0.domain!,
  clientId: config.auth0.clientId,
  clientSecret: config.auth0.clientSecret,
  secret: process.env.AUTH0_SECRET,

  appBaseUrl: config.baseURL,
  signInReturnToPath: '/overview',
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
      console.error('[Auth0] Callback error:', {
        code: error.code,
        message: error.message,
      });
      return NextResponse.redirect(new URL('/unauthorized', baseUrl));
    }

    const roles = getRolesFromUser(session?.user as Record<string, unknown>);
    if (!isOwner(roles)) {
      return NextResponse.redirect(new URL('/unauthorized', baseUrl));
    }

    const returnTo = ctx.returnTo || '/overview';
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  },

  beforeSessionSaved: async (session) => {
    const roles = getRolesFromUser(session.user as Record<string, unknown>);
    session.user = {
      ...(session.user as Record<string, unknown>),
      role: 'owner',
      isOwner: roles.includes('owner'),
    } as unknown as typeof session.user;
    return session;
  },
});
