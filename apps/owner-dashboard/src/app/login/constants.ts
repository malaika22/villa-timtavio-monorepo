export const AUTH_FAILED_HINTS: Record<string, string> = {
  invalid_grant:
    'The login session expired or the callback URL does not match. Add this app’s /api/auth/callback URL to Allowed Callback URLs in Auth0.',
  invalid_client:
    'The Auth0 client secret is invalid. Rotate the secret in Auth0 and update AUTH0_CLIENT_SECRET.',
  access_denied:
    'Auth0 rejected the token request. Confirm this app is a Regular Web Application, the client secret is current, and the API is authorized under the app’s APIs tab.',
  unauthorized_client:
    'This Auth0 application is not allowed to use the authorization code grant. Enable it under Application → Advanced Settings → Grant Types.',
};
