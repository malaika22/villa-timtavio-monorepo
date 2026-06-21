function normalizeAuth0Domain(
  domain?: string,
  issuerBaseURL?: string,
): string | undefined {
  const raw = domain ?? issuerBaseURL;
  if (!raw) return undefined;
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export const config = {
  auth0: {
    domain: normalizeAuth0Domain(
      process.env.AUTH0_DOMAIN,
      process.env.AUTH0_ISSUER_BASE_URL,
    ),
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE,
    auth0Namespace: process.env.AUTH0_NAMESPACE ?? 'https://villatimtavio.com',
  },
  baseURL:
    process.env.AUTH0_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3002',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  publicProfileRoute:
    process.env.NEXT_PUBLIC_PROFILE_ROUTE ?? '/api/auth/profile',
  pusher: {
    appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  },
  lodgify: {
    newBookingUrl:
      process.env.NEXT_PUBLIC_LODGIFY_NEW_BOOKING_URL ??
      'https://app.lodgify.com/bookings/new',
  },
};
