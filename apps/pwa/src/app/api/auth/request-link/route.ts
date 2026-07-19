import { NextRequest, NextResponse } from 'next/server';

const NEUTRAL =
  'If that email is on a reservation, a new access link is on its way.';

// Guest self-service link recovery. Proxies to the API and always returns a
// neutral message so we never reveal whether the email matched a reservation.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: '' }));
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/magic-link/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ message: data.message ?? NEUTRAL });
  } catch {
    return NextResponse.json({ message: NEUTRAL });
  }
}
