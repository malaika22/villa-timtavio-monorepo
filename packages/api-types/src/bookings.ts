export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'SETTLED'
  | 'DEPARTURE_TODAY'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export type ManifestStatus =
  | 'INCOMPLETE'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED';

export type RoomType = 'KING_MASTER_SUITE' | 'LUXURY_BUNK_ROOM'; // canonical definition — re-exported from rooms.ts

/** Per-guest physical presence in the villa (EM-controlled). */
export type GuestArrivalStatus = 'EXPECTED' | 'IN_VILLA' | 'DEPARTED';

export interface ManifestGuest {
  id: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  relationship?: string | null;
  roomNumber?: number | null;
  dietaryRestrictions: string[];
  dietaryOtherDetails?: string | null;
  allergies?: string | null;
  beveragePreferences?: string | null;
  specialNotes?: string | null;
  pwaLinkSent: boolean;
  pwaLinkOpened: boolean;
  arrivalStatus: GuestArrivalStatus;
  createdAt: string;
  updatedAt: string;
  /** Experiences this guest has requested (grouped by guest email). */
  experiences?: GuestExperienceSummary[];
}

export interface GuestExperienceSummary {
  id: string;
  name: string;
  category?: string | null;
  status: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
}

export interface CurrentBooking {
  id: string;
  lodgifyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
  status: BookingStatus;
  manifestStatus: ManifestStatus;
  baseRate: number;
  taxRate: number;
  serviceChargeRate: number;
  primaryGuestId: string;
  primaryGuest: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  manifestGuests: ManifestGuest[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}

/** Rich current-active booking returned to the estate manager dashboard. */
export interface EmCurrentBookingDetail {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
  status: BookingStatus;
  manifestStatus: ManifestStatus;
  internalNotes?: string | null;
  /** True once the primary's access (magic) link has been sent. */
  primaryLinkSent?: boolean;
  primaryGuest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dietaryRestrictions: string[];
    allergies?: string | null;
    beveragePreferences?: string | null;
    winePreferences?: string | null;
  };
  manifestGuests: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    roomNumber?: number | null;
    relationship?: string | null;
    dietaryRestrictions?: string[];
    dietaryOtherDetails?: string | null;
    allergies?: string | null;
    beveragePreferences?: string | null;
    specialNotes?: string | null;
    pwaLinkSent: boolean;
  }[];
  experienceRequests: {
    id: string;
    status: string;
    preferredDate: string;
    confirmedDate?: string | null;
    guestCount: number;
    catalogItem: { name: string } | null;
  }[];
}
