import Link from 'next/link';
import { AUTH_FAILED_HINTS } from './constants';

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

  // Only allow app-relative returnTo values (prevent open-redirect to external URLs).
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
        <h1 className="font-cormorant text-2xl text-manager-text">
          Estate Manager
        </h1>
        <p className="mt-2 text-sm text-manager-text-muted">
          Sign in to access the operations dashboard.
        </p>
        {error === 'auth_failed' && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
            <p>Sign-in could not be completed ({reason ?? 'unknown'}).</p>
            <p className="mt-1">{hint}</p>
          </div>
        )}
        <a
          href={signInHref}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-manager-accent text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Continue to sign in
        </a>
        <p className="mt-4 text-xs text-manager-text-muted">
          Having trouble?{' '}
          <Link href="/unauthorized" className="underline">
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
