'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@repo/api-types';
import type { DiningOrderItem, DiningRequest } from '@repo/api-types';

import {
  useApproveDining,
  usePendingDiningApprovals,
} from '@/hooks/useDining';

function describe(request: DiningRequest): string {
  const items = (request.items ?? []) as DiningOrderItem[];
  if (items.length === 1 && items[0]) return items[0].name;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return `${count} item${count === 1 ? '' : 's'}`;
}

/**
 * Chargeable additions a secondary asked for, waiting on the primary.
 *
 * Only the primary ever sees this — the folio is theirs, so the decision is
 * theirs. The amount leads and the line about whose folio it lands on is what
 * actually makes the decision easy; "pending approval" on its own would tell
 * them nothing they need.
 */
export const DiningApprovals = () => {
  const { data: pending = [] } = usePendingDiningApprovals();
  const decide = useApproveDining();
  const [decliningId, setDecliningId] = useState<string | null>(null);

  if (pending.length === 0) return null;

  return (
    <section className="mb-6">
      <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
        Waiting on you
      </p>

      <div className="flex flex-col gap-2">
        {pending.map((request) => {
          const busy = decide.isPending && decide.variables?.id === request.id;
          return (
            <div
              key={request.id}
              className="rounded-[12px] border border-[#B08D57] bg-[#FBF3DF] px-3.5 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] text-[#2B2824]">
                  {request.requestedByName.split(/\s+/)[0]} asked for an addition
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#8A6D3B]">
                  {formatPrice(Number(request.totalAmount ?? 0))}
                </span>
              </div>

              <p className="mt-0.5 text-[10px] text-[#797168]">
                {describe(request)}
                {request.linkedSittingId ? ' · with your sitting' : ' · to the villa'}
              </p>
              <p className="mt-1.5 text-[9.5px] leading-relaxed text-[#8A6D3B]">
                Goes on your folio, against {request.requestedByName.split(/\s+/)[0]}.
              </p>

              {decliningId === request.id ? (
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      decide.mutate(
                        { id: request.id, approve: false },
                        { onSuccess: () => setDecliningId(null) },
                      )
                    }
                    disabled={busy}
                    className="flex-1 rounded-[8px] bg-[#9A4A38] py-2.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-white disabled:opacity-60"
                  >
                    Yes, decline it
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecliningId(null)}
                    disabled={busy}
                    className="flex-1 rounded-[8px] border border-[#D8D3C9] bg-white py-2.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-[#2B2824]"
                  >
                    Keep deciding
                  </button>
                </div>
              ) : (
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDecliningId(request.id)}
                    disabled={busy}
                    className="flex-1 rounded-[8px] border border-[#D8D3C9] bg-white py-2.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-[#797168]"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      decide.mutate({ id: request.id, approve: true })
                    }
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[#B08D57] py-2.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-white disabled:opacity-60"
                  >
                    {busy && <Loader2 className="size-3 animate-spin" />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
