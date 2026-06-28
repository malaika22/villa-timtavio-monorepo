import { API, createApiClient } from '@repo/api-client';

// Token comes from the Auth0 session (cookie) via the token route — same
// model as the EM dashboard.
async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/auth/token');
    if (!res.ok) return null;
    const { accessToken } = await res.json();
    return accessToken ?? null;
  } catch {
    return null;
  }
}

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  getAccessToken,
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    window.location.href = '/api/auth/logout';
  },
});

export { API };
