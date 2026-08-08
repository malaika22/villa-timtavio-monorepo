import type { CatalogItem } from './catalog';

export type RequestStatus =
  | 'PENDING'
  | 'CONFLICT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type GuestTier = 'PRIMARY' | 'SECONDARY';

export interface ExperienceRequest {
  id: string;
  bookingId: string;
  catalogItemId: string;
  catalogItem?: Pick<
    CatalogItem,
    | 'id'
    | 'name'
    | 'category'
    | 'primaryPhotoUrl'
    | 'durationLabel'
    | 'basePrice'
    | 'priceMax'
    | 'priceUnit'
    | 'isIncluded'
  >;
  requestedByEmail: string;
  requestedByName: string;
  guestTier: GuestTier;
  preferredDate: string;
  preferredTime: string;
  guestCount: number;
  specialRequests?: string | null;
  returnDate?: string | null;
  transportPreference?: string | null;
  status: RequestStatus;
  statusUpdatedAt: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
  confirmedCost?: number | null;
  emNotes?: string | null;
  declineReason?: string | null;
  /** Set when the request is held in CONFLICT — why the slot clashed. */
  conflictReason?: string | null;
  setupPhotoUrl?: string | null;
  setupCompletedAt?: string | null;
  staffMemberName?: string | null;
  primaryApproved: boolean;
  requiresPrimaryApproval: boolean;
  /**
   * Estimate shown at request time and snapshotted, so later catalog edits never
   * rewrite what the primary approved. `estimatedMax` differs from the min only
   * when the estate published a range.
   */
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  priceUnitCode?: string | null;
  /**
   * Rodrigo's hard quote when it landed materially above the estimate — parked
   * awaiting a second primary approval instead of becoming confirmedCost.
   */
  quotedCost?: number | null;
  quoteApprovalRequired: boolean;
  /**
   * Set when a guest asks to cancel something the estate has already confirmed.
   * Not a cancellation in itself — a vendor is booked by then, so the estate
   * unwinds it and confirms. Unconfirmed requests are withdrawn outright and
   * never sit in this state.
   */
  // ── Booking the vendor ────────────────────────────────────────────────
  /** The estate has sent the WhatsApp message. Reads as "being arranged". */
  vendorAskedAt?: string | null;
  vendorAskedBy?: string | null;
  vendorRepliedAt?: string | null;
  /** They said yes. Nothing is confirmed to the guest without this. */
  vendorConfirmedAt?: string | null;
  vendorDeclinedAt?: string | null;
  /** What the vendor charges the estate — not what the guest is charged. */
  vendorQuotedCost?: number | null;
  vendorNote?: string | null;
  /** A time they could do instead, for the guest to accept or turn down. */
  vendorProposedDate?: string | null;
  vendorProposedTime?: string | null;

  // ── Unwinding it ─────────────────────────────────────────────────────
  /** The estate has told the vendor it's off. */
  vendorToldOfCancellationAt?: string | null;
  /** They've said whether there's a fee — which is where cancellationFee came from. */
  vendorCancellationRepliedAt?: string | null;
  vendorCancellationNote?: string | null;

  cancellationRequestedAt?: string | null;
  cancellationRequestedBy?: string | null;
  cancellationReason?: string | null;
  /** What the supplier charged for cancelling late, if anything. */
  cancellationFee?: number | null;
  quoteApprovedAt?: string | null;
  quoteApprovedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperienceRequestDto {
  catalogItemId: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: number;
  specialRequests?: string;
  returnDate?: string;
  transportPreference?: string;
}

export interface ConfirmRequestDto {
  confirmedDate?: string;
  confirmedTime?: string;
  emNotes?: string;
}

export interface ConfirmCostDto {
  confirmedCost: number;
  emNotes?: string;
}

export interface DeclineRequestDto {
  declineReason?: string;
}

export interface EmRequestGuest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface EmRequestBooking {
  id: string;
  /**
   * The stay's own dates. Returned by every EM request endpoint and needed to
   * group a queue by party — a request read on its own says who asked for it,
   * but not whose booking carries the cost or when they arrive.
   */
  checkIn?: string;
  checkOut?: string;
  primaryRoomNumber?: number | null;
  primaryGuest?: EmRequestGuest | null;
}

export interface EmExperienceRequest extends ExperienceRequest {
  booking?: EmRequestBooking;
  catalogItem?: ExperienceRequest['catalogItem'] & {
    vendor?: { id: string; name: string; role?: string | null };
  };
  /** Present once the estate has rated the vendor on this experience. */
  vendorRating?: { id: string; rating: number; notes?: string | null } | null;
}

// ─── Booking the vendor ──────────────────────────────────────────────────────

/** The WhatsApp message, composed server-side so the estate says it the same way. */
export interface VendorMessageDraft {
  vendorId: string;
  vendorName: string;
  phone: string;
  message: string;
  /** wa.me link with the message pre-filled. Opens in the estate's own WhatsApp. */
  whatsappUrl: string;
}

export type VendorReplyOutcome = 'CONFIRMED' | 'DECLINED' | 'ALTERNATIVE';

export interface RecordVendorReplyDto {
  outcome: VendorReplyOutcome;
  /** Their price. Only meaningful on CONFIRMED or ALTERNATIVE. */
  quotedCost?: number;
  note?: string;
  /** Required on ALTERNATIVE — the guest needs something to accept. */
  proposedDate?: string;
  proposedTime?: string;
}

/**
 * Where a request sits with its vendor, derived rather than stored.
 *
 * `NONE` covers everything the estate runs itself, which is most of the
 * catalogue — those never wait on anybody.
 */
export type VendorStage =
  | 'NONE'
  | 'TO_ASK'
  | 'ASKED'
  | 'ALTERNATIVE_OFFERED'
  | 'CONFIRMED'
  | 'DECLINED';

export function vendorStage(req: {
  /**
   * Either shape counts as "has a vendor": the guest payload carries
   * `vendorId`, the estate's carries the nested `vendor`.
   */
  catalogItem?:
    | ({ vendorId?: string | null } & { vendor?: { id: string } | null })
    | null;
  vendorAskedAt?: string | null;
  vendorConfirmedAt?: string | null;
  vendorDeclinedAt?: string | null;
  vendorProposedDate?: string | null;
}): VendorStage {
  const hasVendor = !!(req.catalogItem?.vendorId || req.catalogItem?.vendor);
  if (!hasVendor) return 'NONE';
  if (req.vendorDeclinedAt) return 'DECLINED';
  if (req.vendorConfirmedAt) return 'CONFIRMED';
  if (req.vendorProposedDate) return 'ALTERNATIVE_OFFERED';
  if (req.vendorAskedAt) return 'ASKED';
  return 'TO_ASK';
}

/** Where a cancellation has got to with the vendor. */
export type VendorCancellationStage = 'NONE' | 'NOT_TOLD' | 'TOLD' | 'SETTLED';

export function vendorCancellationStage(req: {
  catalogItem?:
    | ({ vendorId?: string | null } & { vendor?: { id: string } | null })
    | null;
  vendorToldOfCancellationAt?: string | null;
  vendorCancellationRepliedAt?: string | null;
}): VendorCancellationStage {
  if (!(req.catalogItem?.vendorId || req.catalogItem?.vendor)) return 'NONE';
  if (req.vendorCancellationRepliedAt) return 'SETTLED';
  if (req.vendorToldOfCancellationAt) return 'TOLD';
  return 'NOT_TOLD';
}

export interface RecordVendorCancellationDto {
  /** What the vendor is charging the estate, if anything. */
  fee?: number;
  note?: string;
}
