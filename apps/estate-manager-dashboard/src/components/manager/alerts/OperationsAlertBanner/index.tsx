import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

export const OperationsAlertBanner = ({
  message,
  reviewHref,
  reviewLabel = 'Review →',
  onDismiss,
}: {
  message: string;
  reviewHref?: string;
  reviewLabel?: string;
  onDismiss?: () => void;
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
    <div className="flex shrink-0 items-center gap-3">
      {reviewHref ? (
        <Link
          href={reviewHref}
          className="text-sm font-medium text-manager-accent hover:underline"
        >
          {reviewLabel}
        </Link>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded p-0.5 text-[#b45309]/70 transition-colors hover:bg-[#f5e6cf] hover:text-[#b45309]"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  </div>
);
