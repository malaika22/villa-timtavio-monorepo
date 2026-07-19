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
  primaryRoomNumber?: number | null;
  primaryGuest?: EmRequestGuest | null;
}

export interface EmExperienceRequest extends ExperienceRequest {
  booking?: EmRequestBooking;
  catalogItem?: ExperienceRequest['catalogItem'] & {
    vendor?: { id: string; name: string; role?: string | null };
  };
}
