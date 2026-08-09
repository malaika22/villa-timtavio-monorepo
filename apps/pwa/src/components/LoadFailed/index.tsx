'use client';

import { RotateCw, WifiOff } from 'lucide-react';

/**
 * What a guest sees when a screen couldn't load.
 *
 * Almost nothing in the app had one of these: five components out of
 * thirty-six with a query handled `isError`, so a failed folio, a failed menu
 * and a failed status list all rendered as though the guest simply had nothing
 * — which is a lie in a way an error never is, and one they'd act on. A guest
 * told their plan is empty stops checking it.
 *
 * Deliberately not an error code or a stack. What a guest can do about it is
 * try again, and failing that, ask a person who is downstairs.
 */
export const LoadFailed = ({
  what,
  onRetry,
  retrying,
}: {
  /** The thing that didn't load, in a guest's words: "your folio", "the menu". */
  what: string;
  onRetry?: () => void;
  retrying?: boolean;
}) => {
  const offline =
    typeof navigator !== 'undefined' && navigator.onLine === false;

  return (
    <div
      role="alert"
      className="mx-4 my-6 rounded-[14px] border border-[#E3E0DA] bg-white px-5 py-8 text-center"
    >
      <span
        className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#F1EEE8] text-[#8A6D3B]"
        aria-hidden
      >
        <WifiOff className="size-4" />
      </span>

      <p className="font-cormorant text-[17px] text-[#2B2824]">
        {offline ? 'You’re offline' : `We couldn’t load ${what}`}
      </p>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[11.5px] leading-relaxed text-[#797168]">
        {offline
          ? `${what.charAt(0).toUpperCase()}${what.slice(1)} will be here as soon as you have a signal.`
          : 'Nothing is lost — it just didn’t arrive. Try again, or your concierge can tell you anything you need.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] border border-[#0F1F2E] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[2px] text-[#0F1F2E] disabled:opacity-60"
        >
          <RotateCw
            className={retrying ? 'size-3 animate-spin' : 'size-3'}
            aria-hidden
          />
          {retrying ? 'Trying…' : 'Try again'}
        </button>
      )}
    </div>
  );
};
