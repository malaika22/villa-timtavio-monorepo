export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f1] px-6">
      <div className="w-full max-w-md rounded-xl border border-[#e8e4de] bg-white p-8 text-center shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
        <h1 className="text-2xl font-semibold text-[#2b2824]">Access denied</h1>
        <p className="mt-2 text-sm text-[#6b6661]">
          This dashboard is restricted to estate owners. If you believe this is
          a mistake, contact the estate administrator.
        </p>
        <a
          href="/api/auth/logout"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-[#e5e0d8] px-5 text-sm font-medium text-[#2b2824] transition-colors hover:bg-[#faf8f5]"
        >
          Sign out
        </a>
      </div>
    </main>
  );
}
