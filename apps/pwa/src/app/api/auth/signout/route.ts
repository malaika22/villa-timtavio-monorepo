import { config } from '@/config';
import { NextResponse } from 'next/server';

export async function POST() {
  const logoutUrl =
    `https://${config.AUTH0_DOMAIN}/v2/logout` +
    `?client_id=${config.AUTH0_PWA_CLIENT_ID}` +
    `&returnTo=${encodeURIComponent(`${process.env.PWA_URL}/link-expired`)}`;

  return NextResponse.json({ logoutUrl });
}
