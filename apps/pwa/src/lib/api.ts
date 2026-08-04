import { config } from '@/config';
import { API, createApiClient } from '@repo/api-client';

export const api = createApiClient({
  baseUrl: config.NEXT_PUBLIC_API_URL ?? '',
  getAccessToken: () =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  onUnauthorized: (reason) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    document.cookie = 'auth_session=; Max-Age=0; path=/';
    // Carry the reason to the sign-in screen. A guest removed from the manifest
    // was previously told their link had expired — so they requested another,
    // got in, were bounced again, and never learned why.
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    window.location.href = `/link-expired${query}`;
  },
});

export { API };
