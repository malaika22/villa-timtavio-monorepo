// Local mirror of the experience-pricing contract. The Nest app uses CommonJS
// module resolution and doesn't consume @repo/api-types directly, so this is
// kept in sync with packages/api-types/src/pricing.ts by hand.
//
// Every price the estate publishes is an ESTIMATE — it varies with group size
// and season, and Rodrigo issues a hard quote before a service is booked. The
// estimate the guest saw is snapshotted onto the request so the quote can be
// measured against the figure the primary actually approved.

export type PriceMultiplierSource = 'NONE' | 'GUEST_COUNT' | 'NIGHTS';

export interface PriceRate {
  basePrice?: number | null;
  /** Set only when the estate publishes a range; the high end. */
  priceMax?: number | null;
  priceUnit?: {
    code: string;
    shortLabel: string;
    multiplierSource: PriceMultiplierSource;
  } | null;
}

export interface EstimateContext {
  guestCount?: number | null;
  nights?: number | null;
}

export interface PriceEstimate {
  min: number;
  max: number;
  isRange: boolean;
  multiplier: number;
  unitShortLabel: string;
  unitCode?: string;
}

/**
 * How many units the rate applies to. Unknown or non-positive quantities fall
 * back to 1 so an estimate is never silently zeroed.
 */
export function resolveMultiplier(
  source: PriceMultiplierSource | null | undefined,
  ctx: EstimateContext,
): number {
  switch (source) {
    case 'GUEST_COUNT':
      return ctx.guestCount && ctx.guestCount > 0 ? ctx.guestCount : 1;
    case 'NIGHTS':
      return ctx.nights && ctx.nights > 0 ? ctx.nights : 1;
    default:
      return 1;
  }
}

/**
 * Estimated total for a rate in context. Null when the item carries no price at
 * all — it's included/free, so there's nothing to estimate and nothing for the
 * primary to approve.
 */
export function computeEstimate(
  rate: PriceRate,
  ctx: EstimateContext = {},
): PriceEstimate | null {
  const low = rate.basePrice;
  if (low == null) return null;

  const multiplier = resolveMultiplier(rate.priceUnit?.multiplierSource, ctx);
  // A priceMax below the base is a data slip, not a range.
  const high =
    rate.priceMax != null && rate.priceMax > low ? rate.priceMax : low;

  const min = round2(low * multiplier);
  const max = round2(high * multiplier);

  return {
    min,
    max,
    isRange: max > min,
    multiplier,
    unitShortLabel: rate.priceUnit?.shortLabel ?? '',
    unitCode: rate.priceUnit?.code,
  };
}

/**
 * How far above the approved estimate a hard quote may land before it must go
 * back to the primary: the GREATER of 10% or $100. The percentage covers large
 * bookings, the floor stops small ones re-gating on a trivial difference.
 */
export const QUOTE_VARIANCE_PERCENT = 0.1;
export const QUOTE_VARIANCE_FLOOR = 100;

/** Highest quote confirmable without a second primary approval. */
export function quoteApprovalCeiling(estimateMax: number): number {
  return round2(
    estimateMax +
      Math.max(estimateMax * QUOTE_VARIANCE_PERCENT, QUOTE_VARIANCE_FLOOR),
  );
}

/**
 * Whether a hard quote must return to the primary. No estimate on record means
 * there was nothing for them to approve against, so the quote stands.
 */
export function quoteNeedsReapproval(
  quote: number,
  estimateMax?: number | null,
): boolean {
  if (estimateMax == null) return false;
  return quote > quoteApprovalCeiling(estimateMax);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Prisma hands Decimal columns back as objects; estimates need plain numbers. */
export function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
