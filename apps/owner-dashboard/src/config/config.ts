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
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE,
    auth0Namespace: process.env.AUTH0_NAMESPACE ?? 'https://villatimtavio.com',
  },
  baseURL:
    process.env.APP_BASE_URL ??
    process.env.AUTH0_BASE_URL ??
    'http://localhost:3001',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
};
