// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE PRICING
// ─────────────────────────────────────────────────────────────────────────────
// Every price the estate publishes is an ESTIMATE. Pricing shifts with group
// size and season, so Rodrigo issues a hard quote before a service is booked.
// The API, the EM dashboard and the PWA all compute estimates through this
// module so the number a guest sees, the number the primary approves, and the
// number the quote is checked against can never drift apart.

/** What a price unit multiplies its rate by. Mirrors the Prisma enum. */
export type PriceMultiplierSource = 'NONE' | 'GUEST_COUNT' | 'NIGHTS';

export interface PriceUnit {
  id: string;
  /** Stable identifier, e.g. PER_PERSON. */
  code: string;
  /** EM-facing, e.g. "Per person". */
  label: string;
  /** Guest-facing, appended to the rate, e.g. "/ person". */
  shortLabel: string;
  multiplierSource: PriceMultiplierSource;
  isActive: boolean;
  sortOrder: number;
}

/** The rate side: what the estate charges, before any multiplier. */
export interface PriceRate {
  /** Single estimate, or the LOW end when `priceMax` is set. */
  basePrice?: number | null;
  /** Set only when the estate publishes a range. */
  priceMax?: number | null;
  priceUnit?: Pick<PriceUnit, 'code' | 'label' | 'shortLabel' | 'multiplierSource'> | null;
}

/** Quantities a multiplier can draw on. Extend alongside the enum. */
export interface EstimateContext {
  guestCount?: number | null;
  nights?: number | null;
}

export interface PriceEstimate {
  /** Low end of the estimated total (or the only value, when not a range). */
  min: number;
  /** High end. Equals `min` when the estate published a single estimate. */
  max: number;
  /** True when min and max differ — render as a range. */
  isRange: boolean;
  /** How many units the rate was multiplied by (1 for flat units). */
  multiplier: number;
  /** e.g. "/ person" — empty when the item has no unit. */
  unitShortLabel: string;
  /** e.g. PER_PERSON. Snapshotted onto the request. */
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
 * Estimated total for a rate in a given context. Returns null when the item
 * carries no price at all — i.e. it's included/free, so there is nothing to
 * estimate and nothing for the primary to approve.
 */
export function computeEstimate(
  rate: PriceRate,
  ctx: EstimateContext = {},
): PriceEstimate | null {
  const low = rate.basePrice;
  if (low == null) return null;

  const multiplier = resolveMultiplier(rate.priceUnit?.multiplierSource, ctx);
  // A priceMax below the base is a data slip, not a range — ignore it rather
  // than emitting an inverted estimate.
  const high = rate.priceMax != null && rate.priceMax > low ? rate.priceMax : low;

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

// ─── Quote vs estimate ───────────────────────────────────────────────────────

/**
 * How far above the approved estimate a hard quote may land before it has to go
 * back to the primary for a second approval: the GREATER of 10% or $100. The
 * percentage covers large bookings, the floor stops small ones from re-gating on
 * a trivial difference. Change these two numbers to retune the policy.
 */
export const QUOTE_VARIANCE_PERCENT = 0.1;
export const QUOTE_VARIANCE_FLOOR = 100;

/** The highest quote that can be confirmed without a second primary approval. */
export function quoteApprovalCeiling(estimateMax: number): number {
  return round2(
    estimateMax +
      Math.max(estimateMax * QUOTE_VARIANCE_PERCENT, QUOTE_VARIANCE_FLOOR),
  );
}

/**
 * Whether a hard quote needs to return to the primary. No estimate on record
 * means there was nothing for them to approve against, so the quote stands.
 */
export function quoteNeedsReapproval(
  quote: number,
  estimateMax?: number | null,
): boolean {
  if (estimateMax == null) return false;
  return quote > quoteApprovalCeiling(estimateMax);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "$150" or "$150–$220" — the rate itself, without the unit. */
export function formatRateRange(
  basePrice?: number | null,
  priceMax?: number | null,
): string {
  if (basePrice == null) return '';
  const hasRange = priceMax != null && priceMax > basePrice;
  return hasRange
    ? `${formatPrice(basePrice)}–${formatPrice(priceMax)}`
    : formatPrice(basePrice);
}

/** "≈ $1,050" or "≈ $1,050–$1,540" — the estimated total. */
export function formatEstimateTotal(estimate: PriceEstimate): string {
  return estimate.isRange
    ? `${formatPrice(estimate.min)}–${formatPrice(estimate.max)}`
    : formatPrice(estimate.min);
}

/** "$150 / person × 7" — shows the working behind the total. */
export function formatEstimateWorking(
  rate: PriceRate,
  estimate: PriceEstimate,
): string {
  const rateLabel = formatRateRange(rate.basePrice, rate.priceMax);
  const unit = estimate.unitShortLabel ? ` ${estimate.unitShortLabel}` : '';
  return estimate.multiplier > 1
    ? `${rateLabel}${unit} × ${estimate.multiplier}`
    : `${rateLabel}${unit}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
