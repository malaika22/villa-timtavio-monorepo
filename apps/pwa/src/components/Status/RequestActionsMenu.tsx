'use client';

import { useState } from 'react';
import {
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { ExperienceRequest } from '@repo/api-types';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';

import { useAuth } from '@/hooks/useAuth';
import { useCancelRequest } from '@/hooks/useRequests';

/** Still just an intention — nothing has been arranged on the guest's behalf. */
const NOT_YET_COMMITTED = ['PENDING', 'CONFLICT'];
/** Over, or already off — nothing left to change. */
const CLOSED = ['CANCELLED', 'COMPLETED'];

/**
 * Everything a guest might want to do about a request, behind one control.
 *
 * The only way out used to be an underlined link below six timeline rows, a
 * photo placeholder and two contact buttons — so in practice guests telephoned
 * the estate, which is what self-service cancellation was built to avoid.
 *
 * It sits in the header because that is where people look for one, and it
 * carries the two things a guest more often wants alongside the one they
 * rarely do: most people opening this menu want to *change* something, and the
 * screen offered no way to say so. Nothing is red until they choose the item
 * that is — the weight belongs in the confirmation, not the doorway.
 */
export const RequestActionsMenu = ({
  request,
}: {
  request: ExperienceRequest;
}) => {
  const { email, isPrimary } = useAuth();
  const cancel = useCancelRequest();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (CLOSED.includes(request.status)) return null;

  // The requester may drop their own; the primary may drop anyone's, since
  // every charge on the booking is ultimately theirs.
  const isMine =
    !!email && request.requestedByEmail?.toLowerCase() === email.toLowerCase();
  const mayCancel = isMine || isPrimary;

  const alreadyAsked = !!request.cancellationRequestedAt;
  const committed = !NOT_YET_COMMITTED.includes(request.status);

  const close = () => {
    setMenuOpen(false);
    setConfirming(false);
    cancel.reset();
  };

  const submit = () =>
    cancel.mutate(
      { id: request.id },
      // Closing on success is the point: the panel used to stay open with no
      // signal, so a guest couldn't tell whether anything had happened and
      // pressed it again.
      { onSuccess: close },
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="More options"
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#E3E0DA] text-[#797168] hover:bg-[#EAE7E1]"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>

      {/* vaul rather than a hand-rolled `fixed inset-0`: this used to appear
          and vanish with no transition at all, while every other sheet in the
          app slid. The same gesture behaving differently depending on the
          screen is what read as the app being broken. */}
      <Drawer open={menuOpen} onOpenChange={(v) => !v && close()}>
        <DrawerContent className="bg-white pb-6">
          <DrawerTitle className="sr-only">
            {request.catalogItem?.name ?? 'This experience'}
          </DrawerTitle>
          <div className="px-4 pt-1" data-vaul-no-drag>
            {confirming ? (
              <>
                <p className="font-cormorant text-[18px] text-[#2B2824]">
                  {committed
                    ? 'Ask the estate to cancel?'
                    : 'Remove from your plan?'}
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#797168]">
                  <span className="font-medium text-[#2B2824]">
                    {request.catalogItem?.name ?? 'This experience'}
                  </span>
                  {committed
                    ? ' — the estate has arranged this with a supplier. They’ll unwind it and confirm. A late cancellation may carry a fee, which would appear on your folio.'
                    : ' — nothing has been arranged yet, so it simply comes off your plan and nothing is charged.'}
                </p>

                {cancel.isError && (
                  <p className="mt-2 text-[11px] text-[#9A4A38]">
                    {(cancel.error as Error).message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={cancel.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#9A4A38] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
                >
                  {cancel.isPending && (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  )}
                  {committed ? 'Request cancellation' : 'Remove it'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={cancel.isPending}
                  className="mt-2 w-full rounded-[10px] border border-[#E3E0DA] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-[#797168]"
                >
                  Keep it
                </button>
              </>
            ) : (
              <ul>
                <MenuItem
                  icon={<MessageCircle className="size-4" aria-hidden />}
                  label="Change the date or time"
                  sub="Ask the estate to move it"
                  href="#contact"
                  onSelect={close}
                />
                <MenuItem
                  icon={<MessageCircle className="size-4" aria-hidden />}
                  label="Message the estate"
                  sub="WhatsApp or call"
                  href="#contact"
                  onSelect={close}
                />

                {mayCancel && !alreadyAsked && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="flex w-full items-center gap-3 border-t border-[#F0EDE6] py-3 text-left"
                    >
                      <span className="text-[#9A4A38]">
                        <Trash2 className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] text-[#9A4A38]">
                          {committed
                            ? 'Request cancellation'
                            : 'Remove from plan'}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#9A4A38]/70">
                          {committed
                            ? 'A supplier is booked — a fee may apply'
                            : 'Nothing is arranged yet'}
                        </span>
                      </span>
                    </button>
                  </li>
                )}

                {alreadyAsked && (
                  <li className="border-t border-[#F0EDE6] py-3 text-[11px] leading-snug text-[#797168]">
                    Cancellation requested. The estate is unwinding this with
                    the supplier and will confirm.
                  </li>
                )}

                <li className="pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E3E0DA] py-2.5 text-[10px] font-semibold uppercase tracking-[1.8px] text-[#797168]"
                  >
                    <X className="size-3" aria-hidden />
                    Close
                  </button>
                </li>
              </ul>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const MenuItem = ({
  icon,
  label,
  sub,
  href,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
  onSelect: () => void;
}) => (
  <li>
    <a
      href={href}
      onClick={onSelect}
      className="flex items-center gap-3 border-t border-[#F0EDE6] py-3 first:border-t-0"
    >
      <span className="text-[#797168]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] text-[#2B2824]">{label}</span>
        <span className="mt-0.5 block text-[10px] text-[#9A9288]">{sub}</span>
      </span>
      <span className="text-[#9A9288]">›</span>
    </a>
  </li>
);
