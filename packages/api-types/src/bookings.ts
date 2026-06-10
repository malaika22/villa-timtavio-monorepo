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
  allergies?: string | null;
  beveragePreferences?: string | null;
  specialNotes?: string | null;
  pwaLinkSent: boolean;
  pwaLinkOpened: boolean;
  createdAt: string;
  updatedAt: string;
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
