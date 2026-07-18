export const config = {
  // NEXT_PUBLIC_ so it's available in the browser (the callback reads roles/
  // bookingId claims client-side). Defaults to the API's namespace constant so
  // claims resolve even if the env var isn't set.
  AUTH_NAMESPACE_URL:
    process.env.NEXT_PUBLIC_AUTH_NAMESPACE_URL ?? 'https://villatimtavio.com',
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_PWA_CLIENT_ID: process.env.AUTH0_PWA_CLIENT_ID,
  AUTH0_PWA_CLIENT_SECRET: process.env.AUTH0_PWA_CLIENT_SECRET,
  AUTH0_REGULAR_CLIENT_ID: process.env.AUTH0_REGULAR_CLIENT_ID,
  AUTH0_REGULAR_CLIENT_SECRET: process.env.AUTH0_REGULAR_CLIENT_SECRET,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};
