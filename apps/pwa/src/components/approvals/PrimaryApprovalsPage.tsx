'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Check, X, ShieldCheck, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@repo/ui/components/button';
import { Textarea } from '@repo/ui/components/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@repo/ui/components/sheet';
import type { ExperienceRequest } from '@repo/api-types';

import { useAuth } from '@/hooks/useAuth';
import {
  usePendingApprovalRequests,
  usePrimaryApprove,
  usePrimaryDecline,
} from '@/hooks/useRequests';

function formatWhen(req: ExperienceRequest) {
  try {
    return `${format(parseISO(req.preferredDate), 'EEE, MMM d')}${
      req.preferredTime ? ` · ${req.preferredTime}` : ''
    }`;
  } catch {
    return req.preferredTime ?? '';
  }
}

function formatPrice(value?: number | null) {
  if (value == null) return null;
  return `$${Number(value).toLocaleString()}`;
}

export const PrimaryApprovalsPage = () => {
  const router = useRouter();
  const { isPrimary } = useAuth();
  const { data: requests = [], isLoading } = usePendingApprovalRequests();

  const approve = usePrimaryApprove();
  const decline = usePrimaryDecline();

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const decliningRequest = requests.find((r) => r.id === decliningId) ?? null;

  const submitDecline = () => {
    if (!decliningId || !reason.trim()) return;
    decline.mutate(
      { id: decliningId, reason: reason.trim() },
      {
        onSuccess: () => {
          setDecliningId(null);
          setReason('');
        },
      },
    );
  };

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[2px] text-[#797168]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </button>
        <h1 className="font-cormorant text-[22px] italic text-[#2B2824]">
          Approvals
        </h1>
        <span className="w-9" />
      </div>

      <p className="mb-4 text-[11px] leading-[1.5] text-[#797168]">
        Paid experiences requested by your party need your approval before the
        estate confirms them.
      </p>

      {!isPrimary ? (
        <EmptyState
          title="Not available"
          body="Only the primary member can review approval requests."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[14px] bg-[#E8E5E0]"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="All caught up"
          body="There are no requests waiting for your approval right now."
        />
      ) : (
        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {requests.map((req) => {
            const price = formatPrice(req.catalogItem?.basePrice);
            const busy =
              (approve.isPending && approve.variables === req.id) ||
              (decline.isPending && decliningId === req.id);
            return (
              <motion.article
                key={req.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="overflow-hidden rounded-[14px] border border-[#E3E0DA] bg-white p-4 shadow-[0_1px_3px_rgba(15,31,46,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-cormorant text-[18px] font-semibold leading-tight text-[#2B2824]">
                      {req.catalogItem?.name ?? 'Experience'}
                    </h2>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[1.5px] text-[#9A9288]">
                      Requested by {req.requestedByName}
                    </p>
                  </div>
                  {price ? (
                    <span className="shrink-0 rounded-full bg-[#0F1F2E] px-2.5 py-1 text-[11px] font-semibold text-white">
                      {price}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-1 text-[11px] text-[#5E5750]">
                  <p>{formatWhen(req)}</p>
                  <p>
                    {req.guestCount} guest{req.guestCount === 1 ? '' : 's'}
                  </p>
                  {req.specialRequests ? (
                    <p className="text-[#797168]">
                      <span className="font-medium text-[#2B2824]">Note: </span>
                      {req.specialRequests}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => approve.mutate(req.id)}
                    disabled={busy}
                    className="h-10 flex-1 gap-1.5 rounded-lg bg-[#3A5E48] text-[11px] font-semibold uppercase tracking-[1.5px] text-white hover:bg-[#2F4A3A] disabled:opacity-60"
                  >
                    {busy && approve.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Check className="size-3.5" aria-hidden />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDecliningId(req.id);
                      setReason('');
                    }}
                    disabled={busy}
                    className="h-10 flex-1 gap-1.5 rounded-lg border-[#E0C4BE] bg-white text-[11px] font-semibold uppercase tracking-[1.5px] text-[#B42318] hover:bg-[#FEF6F4] disabled:opacity-60"
                  >
                    <X className="size-3.5" aria-hidden />
                    Decline
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      {/* Decline reason sheet */}
      <Sheet
        open={!!decliningId}
        onOpenChange={(open) => {
          if (!open) {
            setDecliningId(null);
            setReason('');
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-cormorant text-[20px] italic text-[#2B2824]">
              Decline request
            </SheetTitle>
            <SheetDescription className="text-[11px] text-[#797168]">
              {decliningRequest?.catalogItem?.name
                ? `Let ${decliningRequest.requestedByName} and the estate know why “${decliningRequest.catalogItem.name}” isn’t approved.`
                : 'Add a reason — the guest and the estate will see it.'}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for declining…"
              rows={4}
              className="w-full resize-none rounded-[12px] border-[#E3E0DA] text-[13px]"
            />
          </div>

          <div className="flex gap-2 px-4 pb-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDecliningId(null);
                setReason('');
              }}
              className="h-11 flex-1 rounded-lg border-[#E3E0DA] text-[11px] font-semibold uppercase tracking-[1.5px] text-[#5E5750]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitDecline}
              disabled={!reason.trim() || decline.isPending}
              className="h-11 flex-1 gap-1.5 rounded-lg bg-[#B42318] text-[11px] font-semibold uppercase tracking-[1.5px] text-white hover:bg-[#911C13] disabled:opacity-60"
            >
              {decline.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              Decline request
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#D8D3C9] bg-[#FAF9F7] px-6 py-12 text-center">
      <ShieldCheck className="size-7 text-[#B0AAA0]" strokeWidth={1.5} aria-hidden />
      <p className="font-cormorant text-[18px] italic text-[#2B2824]">{title}</p>
      <p className="text-[11px] leading-snug text-[#797168]">{body}</p>
    </div>
  );
}
