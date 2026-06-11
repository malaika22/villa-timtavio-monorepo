import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f1] px-6">
      <div className="w-full max-w-md rounded-xl border border-[#e8e4de] bg-white p-8 text-center shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
        <h1 className="font-cormorant text-2xl text-manager-text">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-manager-text-muted">
          Your account does not have permission to access this dashboard.
          Please contact the estate administrator.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href="/api/auth/logout"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#e5e0d8] text-sm font-medium text-manager-text transition-colors hover:bg-[#faf8f5]"
          >
            Sign out
          </a>
          <Link
            href="/login"
            className="text-xs text-manager-text-muted underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
