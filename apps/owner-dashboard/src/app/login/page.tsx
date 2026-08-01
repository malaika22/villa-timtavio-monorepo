import Link from 'next/link';
import { AUTH_FAILED_HINTS } from './constants';

/**
 * Mirrors the estate manager's sign-in screen so both dashboards behave the
 * same way: land on an app-owned page first, then continue to Auth0 on an
 * explicit click.
 *
 * Redirecting straight to Auth0 also meant the browser was navigating to an
 * external origin on the app's behalf — including on route prefetches — which
 * is what produced the "Unsafe attempt to load URL …auth0.com/authorize… from
 * frame" console error. An internal redirect keeps that navigation same-origin.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; returnTo?: string }>;
}) {
  const { error, reason, returnTo } = await searchParams;
  const hint =
    reason && AUTH_FAILED_HINTS[reason]
      ? AUTH_FAILED_HINTS[reason]
      : AUTH_FAILED_HINTS.access_denied;

  // Only allow app-relative returnTo values (prevents open-redirect).
  const safeReturnTo =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : undefined;
  const signInHref = safeReturnTo
    ? `/api/auth/login?returnTo=${encodeURIComponent(safeReturnTo)}`
    : '/api/auth/login';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f1] px-6">
      <div className="w-full max-w-sm rounded-xl border border-[#e8e4de] bg-white p-8 text-center shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
        <h1 className="font-cormorant text-2xl text-intel-text">
          Villa TimTavio
        </h1>
        <p className="mt-1 text-[10px] uppercase tracking-[2px] text-intel-text-muted">
          Intelligence Dashboard
        </p>
        <p className="mt-3 text-sm text-intel-text-muted">
          Sign in to access estate intelligence.
        </p>

        {error === 'auth_failed' && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
            <p>Sign-in could not be completed ({reason ?? 'unknown'}).</p>
            <p className="mt-1">{hint}</p>
          </div>
        )}

        <a
          href={signInHref}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-intel-maroon text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Continue to sign in
        </a>

        <p className="mt-4 text-xs text-intel-text-muted">
          Having trouble?{' '}
          <Link href="/unauthorized" className="underline">
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
