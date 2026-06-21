import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { otp, email } = await req.json();

    if (!otp || !email) {
      return NextResponse.json(
        { message: 'OTP and email are required' },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const verifyRes = await fetch(`${apiUrl}/api/v1/magic-link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, email }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      return NextResponse.json(
        { message: err.message || 'Invalid or expired magic link' },
        { status: 400 },
      );
    }

    const { access_token, expires_in } = await verifyRes.json();

    const response = NextResponse.json({ access_token, expires_in });

    response.cookies.set('auth_session', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in ?? 86400,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
