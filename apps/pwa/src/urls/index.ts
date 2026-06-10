import { API } from '@repo/api-client';
import { config } from '@/config';

export const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export const API_URLS = {
  manifestLinkOpen: `${baseUrl}${API.manifest.linkOpened}`,
  oauthToken: `https://${config.AUTH0_DOMAIN}/oauth/token`,
  signOut: '/api/auth/signout',
};

export const ROUTE_URLS = {
  home: '/',
};
