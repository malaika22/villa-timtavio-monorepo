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
}
