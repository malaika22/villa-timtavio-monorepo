'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarClock, Loader2 } from 'lucide-react';
import type { ExperienceRequest } from '@repo/api-types';

import { useRespondToAlternative } from '@/hooks/useRequests';

/**
 * A time the provider offered instead.
 *
 * The estate could previously only confirm or decline, so "they can't do six
 * but could do seven" had to be forced into one of those — usually by moving
 * the booking and telling the guest afterwards, which is how somebody arrives
 * an hour early to an empty dock. The choice is theirs to make.
 */
export const AlternativeTimeCard = ({
  request,
}: {
  request: ExperienceRequest;
}) => {
  const respond = useRespondToAlternative();
  const [confirming, setConfirming] = useState<'accept' | 'decline' | null>(
    null,
  );

  if (!request.vendorProposedDate) return null;

  const when = parseISO(request.vendorProposedDate.slice(0, 10));
  const originally = parseISO(
    (request.confirmedDate ?? request.preferredDate).slice(0, 10),
  );

  return (
    <section className="overflow-hidden rounded-[12px] border border-[#C7A046] bg-[#FBF3DF]">
      <div className="flex items-start gap-2.5 px-3.5 pt-3">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-[#8A6D3B]" aria-hidden />
        <div className="min-w-0">
          <p className="font-cormorant text-[16px] leading-tight text-[#2B2824]">
            A different time is available
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#8A6D3B]">
            {request.catalogItem?.name ?? 'This experience'} isn&rsquo;t
            available on {format(originally, 'EEEE d MMMM')} at{' '}
            {request.confirmedTime ?? request.preferredTime}
            {request.vendorNote ? ` — “${request.vendorNote}”` : '.'}
          </p>
        </div>
      </div>

      <div className="mx-3.5 mt-3 rounded-[10px] border border-[#E0CFA0] bg-white px-3 py-2.5">
        <p className="text-[8.5px] uppercase tracking-[2px] text-[#9A9288]">
          They could do
        </p>
        <p className="mt-0.5 text-[14px] text-[#2B2824]">
          {format(when, 'EEEE d MMMM')} at {request.vendorProposedTime}
        </p>
      </div>

      {respond.isError && (
        <p className="mx-3.5 mt-2 text-[11px] text-[#9A4A38]">
          {(respond.error as Error).message}
        </p>
      )}

      <div className="flex flex-col gap-2 p-3.5">
        {confirming === 'decline' ? (
          <>
            <p className="text-[11px] leading-relaxed text-[#8A6D3B]">
              Turning this down ends the request. You can always ask again for
              another day.
            </p>
            <button
              type="button"
              onClick={() =>
                respond.mutate({ id: request.id, accept: false })
              }
              disabled={respond.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#9A4A38] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
            >
              {respond.isPending && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              )}
              Yes, let it go
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="w-full py-2 text-[10px] font-medium uppercase tracking-[1.6px] text-[#797168]"
            >
              Keep deciding
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => respond.mutate({ id: request.id, accept: true })}
              disabled={respond.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0F1F2E] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
            >
              {respond.isPending && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              )}
              Take the new time
            </button>
            {/* The weight belongs in the confirmation, not the doorway. */}
            <button
              type="button"
              onClick={() => setConfirming('decline')}
              className="w-full py-2 text-[10px] font-medium uppercase tracking-[1.6px] text-[#797168]"
            >
              Not this time
            </button>
          </>
        )}
      </div>
    </section>
  );
};
