import type { ManifestGuest } from './bookings';

export type { ManifestGuest };

export interface ManifestResponse {
  bookingId: string;
  manifestStatus: 'INCOMPLETE' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED';
  totalGuests: number;
  addedGuests: number;
  progressPercent: number;
  primaryGuest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  guests: ManifestGuest[];
  roomSummary: RoomSummaryItem[];
}

export interface RoomSummaryItem {
  roomNumber: number;
  roomName: string;
  capacity: number;
  assignedGuests: number;
  availableCapacity: number;
}

export interface CreateManifestGuestDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  relationship?: string;
  roomNumber?: number;
  dietaryRestrictions?: string[];
  allergies?: string;
  beveragePreferences?: string;
  specialNotes?: string;
}

export type UpdateManifestGuestDto = Partial<CreateManifestGuestDto>;

export interface ChefsBriefResponse {
  bookingId: string;
  checkIn: string;
  checkOut: string;
  primaryGuest: { firstName: string; lastName: string; email: string };
  guests: Array<{
    firstName: string;
    lastName: string;
    roomNumber?: number | null;
    dietaryRestrictions: string[];
    allergies?: string | null;
    beveragePreferences?: string | null;
    specialNotes?: string | null;
  }>;
  totalGuests: number;
}
