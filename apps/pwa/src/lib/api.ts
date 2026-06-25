import { config } from '@/config';
import { API, createApiClient } from '@repo/api-client';

export const api = createApiClient({
  baseUrl: config.NEXT_PUBLIC_API_URL ?? '',
  getAccessToken: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null,
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    document.cookie = 'auth_session=; Max-Age=0; path=/';
    window.location.href = '/link-expired';
  },
});

export { API };
