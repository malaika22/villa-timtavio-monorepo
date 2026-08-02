'use client';

import { formatPrice } from '@repo/api-types';
import type { ExperienceRequest } from '@repo/api-types';

import { useAuth } from '@/hooks/useAuth';

/** Anything the guest is still expecting to happen, and therefore to pay for. */
const LIVE = ['PENDING', 'CONFLICT', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED'];

/**
 * What a request will cost, as best anyone currently knows: the agreed price
 * once there is one, otherwise the top of the estimate the guest was shown.
 *
 * The top rather than the middle deliberately — a guest deciding what they can
 * afford is better served by the number that won't be exceeded than by one that
 * flatters the plan.
 */
function likelyCost(r: ExperienceRequest): number {
  if (r.confirmedCost != null) return Number(r.confirmedCost);
  if (r.estimatedMax != null) return Number(r.estimatedMax);
  if (r.estimatedMin != null) return Number(r.estimatedMin);
  return 0;
}

/**
 * The running total behind the guest's plan.
 *
 * Deliberately not the folio. The folio is the bill and stays near-empty until
 * the estate has agreed prices — which, for a stay booked months out, can be
 * weeks away. This is what the guest is actually deciding against, and it says
 * plainly that it's an estimate until it isn't.
 */
export const PlanSummary = ({
  requests,
}: {
  requests: ExperienceRequest[];
}) => {
  const { email, isPrimary } = useAuth();

  const live = requests.filter((r) => LIVE.includes(r.status));
  if (live.length === 0) return null;

  const total = live.reduce((sum, r) => sum + likelyCost(r), 0);
  if (total === 0) return null;

  // "≈" only while something is still unpriced — once every price is agreed the
  // figure is exact and shouldn't keep apologising for itself.
  const anyEstimated = live.some((r) => r.confirmedCost == null);
  const settled = live.filter((r) => r.confirmedCost != null).length;

  // The primary carries the whole party's spend, so they see the aggregate and
  // who it belongs to. A secondary only ever sees their own.
  const byGuest = isPrimary
    ? Object.values(
        live.reduce<Record<string, { name: string; total: number; isMe: boolean }>>(
          (acc, r) => {
            const key = r.requestedByEmail?.toLowerCase() ?? 'unknown';
            const isMe = !!email && key === email.toLowerCase();
            acc[key] ??= {
              name: isMe ? 'You' : (r.requestedByName?.split(/\s+/)[0] ?? 'Guest'),
              total: 0,
              isMe,
            };
            acc[key].total += likelyCost(r);
            return acc;
          },
          {},
        ),
      ).sort((a, b) => (a.isMe === b.isMe ? b.total - a.total : a.isMe ? -1 : 1))
    : [];

  return (
    <section className="rounded-[14px] border border-[#B08D57]/40 bg-[#FBF3DF] px-4 py-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-[1.5px] text-[#8A6D3B]">
        {isPrimary ? 'Your party’s plan' : 'Your plan'}
      </p>

      <p className="mt-1 flex items-baseline gap-1.5">
        {anyEstimated && (
          <span className="font-sans text-[15px] text-[#8A6D3B]">≈</span>
        )}
        <span className="font-cormorant text-[30px] leading-none text-[#2B2824]">
          {formatPrice(total)}
        </span>
      </p>

      <p className="mt-1 text-[11px] leading-snug text-[#797168]">
        {live.length} experience{live.length === 1 ? '' : 's'}
        {anyEstimated
          ? settled > 0
            ? ` · ${settled} priced, the rest estimated`
            : ' · estimated until your concierge confirms each price'
          : ' · all prices confirmed'}
      </p>

      {byGuest.length > 1 && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#B08D57]/25 pt-2 text-[11px] text-[#797168]">
          {byGuest.map((g) => (
            <span key={g.name} className={g.isMe ? 'text-[#8A6D3B]' : undefined}>
              {g.name}{' '}
              <span className="font-semibold tabular-nums">
                {formatPrice(g.total)}
              </span>
            </span>
          ))}
        </p>
      )}
    </section>
  );
};
