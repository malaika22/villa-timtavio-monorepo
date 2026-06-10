import { API, createApiClient } from '@repo/api-client';

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  getAccessToken: () =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  },
});

export { API };
