export function SkeletonText({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton skeleton-dark rounded ${className ?? 'h-3 w-10'}`}
    />
  );
}
