export function SkeletonText({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className ?? 'h-3 w-10'}`}
    />
  );
}
