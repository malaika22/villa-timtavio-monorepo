import { API_URLS } from '@/urls';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code required' },
        { status: 400 },
      );
    }

    const tokenRes = await fetch(API_URLS.oauthToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: config.AUTH0_PWA_CLIENT_ID,
        client_secret: config.AUTH0_PWA_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.PWA_URL}/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      return NextResponse.json(
        { message: err.error_description || 'Token exchange failed' },
        { status: 400 },
      );
    }

    const tokens = await tokenRes.json();

    const response = NextResponse.json({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      expires_in: tokens.expires_in,
    });

    // Set HttpOnly cookie so middleware can verify session server-side
    response.cookies.set('auth_session', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in ?? 86400,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
