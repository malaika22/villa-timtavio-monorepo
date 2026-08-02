import type { AuthUser } from '@/types/auth';
import { decodeJwt } from '@/helpers/jwt';
import { getNamespaceUrl } from '@/helpers/namespace';
import { API_URLS } from '@/urls';

/**
 * Turn a one-time code into a session.
 *
 * Shared by the two ways a guest can arrive with one: tapping the link in their
 * email, and typing the six digits by hand. The second exists because an
 * installed PWA has its own storage — it opens signed out, and on iOS an
 * emailed link opens Safari rather than the installed app, so a guest with no
 * way to type the code could never get into the app they just installed.
 *
 * Throws with the server's message so the caller can show it inline.
 */
export async function completeOtpSignIn(
  otp: string,
  email: string,
  setUser: (user: AuthUser) => void,
): Promise<void> {
  const res = await fetch('/api/auth/exchange-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp, email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Token exchange failed');
  }

  const { access_token } = await res.json();
  localStorage.setItem('access_token', access_token);

  const payload = decodeJwt(access_token);
  if (!payload) return;

  const namespace = getNamespaceUrl();
  setUser({
    auth0Id: payload.sub,
    email: payload.email || '',
    firstName: payload.given_name || '',
    roles: payload[`${namespace}/roles`] || [],
    bookingId: payload[`${namespace}/bookingId`] || '',
    guestTier: payload[`${namespace}/guestTier`] || 'secondary',
    accessToken: access_token,
    tokenExpiry: payload.exp,
  });

  const bookingId = payload[`${namespace}/bookingId`];
  if (bookingId) {
    // Best-effort: tells the estate the guest opened their link. Never worth
    // failing a sign-in over.
    fetch(`${API_URLS.manifestLinkOpen}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ bookingId, email: payload.email }),
    }).catch(() => {});
  }
}
