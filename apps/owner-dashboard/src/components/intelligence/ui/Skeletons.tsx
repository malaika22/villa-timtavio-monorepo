// Shared loading skeletons for the intelligence dashboard. Used in place of the
// old "sample data" fallbacks so a reload/empty state shows a skeleton, never
// fabricated numbers.

export function KpiSkeleton({
  count = 4,
  cols = 'lg:grid-cols-4',
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[116px] animate-pulse rounded-xl border border-[#eee7dc] bg-[#f0ede8]"
        />
      ))}
    </div>
  );
}

export function BlockSkeleton({
  className = 'h-64',
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full animate-pulse rounded-xl border border-[#eee7dc] bg-[#f0ede8] ${className}`}
      aria-busy="true"
    />
  );
}
