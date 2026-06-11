import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const OperationsAlertBanner = ({
  message,
  reviewHref,
  reviewLabel = 'Review →',
}: {
  message: string;
  reviewHref?: string;
  reviewLabel?: string;
}) => (
  <div
    className="flex items-start justify-between gap-3 rounded-lg border border-[#e8d4b8] bg-[#fef6eb] px-4 py-3"
    role="alert"
  >
    <div className="flex min-w-0 items-start gap-2.5">
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-[#b45309]"
        strokeWidth={2}
      />
      <p className="text-sm leading-snug text-manager-text">{message}</p>
    </div>
    {reviewHref ? (
      <Link
        href={reviewHref}
        className="shrink-0 text-sm font-medium text-manager-accent hover:underline"
      >
        {reviewLabel}
      </Link>
    ) : null}
  </div>
);
