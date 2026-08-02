'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import type { ExperienceRequest } from '@repo/api-types';

import { useAuth } from '@/hooks/useAuth';
import { useCancelRequest } from '@/hooks/useRequests';

/** Still just an intention — nothing has been arranged on the guest's behalf. */
const NOT_YET_COMMITTED = ['PENDING', 'CONFLICT'];
/** Over, or already off — nothing left to cancel. */
const CLOSED = ['CANCELLED', 'COMPLETED'];

/**
 * One intention, two different acts.
 *
 * Before the estate confirms, nothing is arranged and the guest simply takes it
 * off their plan. Afterwards a vendor is booked, so all they can do is ask —
 * and a late cancellation may carry a fee. The button says which, because the
 * consequences genuinely differ and a single word like "Cancel" would hide that.
 */
export const CancelRequestAction = ({
  request,
}: {
  request: ExperienceRequest;
}) => {
  const { email, isPrimary } = useAuth();
  const cancel = useCancelRequest();
  const [confirming, setConfirming] = useState(false);

  if (CLOSED.includes(request.status)) return null;

  // The requester may drop their own; the primary may drop anyone's, since
  // every charge on the booking is ultimately theirs.
  const isMine =
    !!email &&
    request.requestedByEmail?.toLowerCase() === email.toLowerCase();
  if (!isMine && !isPrimary) return null;

  if (request.cancellationRequestedAt) {
    return (
      <p className="rounded-[10px] border border-[#E3E0DA] bg-[#F7F5F2] px-3 py-2.5 text-[11.5px] leading-snug text-[#797168]">
        Cancellation requested. The estate is unwinding this with the supplier
        and will confirm — any fee they charge will appear on the folio.
      </p>
    );
  }

  const committed = !NOT_YET_COMMITTED.includes(request.status);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start text-[11.5px] font-medium text-[#9A4A38] underline underline-offset-2"
      >
        {committed ? 'Request cancellation' : 'Remove from plan'}
      </button>
    );
  }

  return (
    <div className="rounded-[10px] border border-[#D8B4A8] bg-[#FBF0ED] px-3 py-3">
      <p className="text-[11.5px] leading-snug text-[#7A3324]">
        {committed
          ? 'The estate has arranged this with a supplier. They’ll unwind it and confirm — a late cancellation may carry a fee, which would go on the folio.'
          : 'This hasn’t been arranged yet, so it will simply come off your plan.'}
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button
          type="button"
          onClick={() => cancel.mutate({ id: request.id })}
          disabled={cancel.isPending}
          className="h-9 flex-1 rounded-[8px] bg-[#9A4A38] text-[10px] font-semibold uppercase tracking-[1.4px] text-white hover:bg-[#823E2F]"
        >
          {cancel.isPending && (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          )}
          {committed ? 'Request it' : 'Remove it'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={cancel.isPending}
          className="h-9 flex-1 rounded-[8px] border-[#D8D3C9] bg-white text-[10px] font-semibold uppercase tracking-[1.4px] text-[#2B2824]"
        >
          Keep it
        </Button>
      </div>
    </div>
  );
};
