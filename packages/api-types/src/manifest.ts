import type { ManifestGuest, GuestArrivalStatus } from './bookings';

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
    /** The primary member's own manifest details (self-service). */
    roomNumber?: number | null;
    arrivalStatus: GuestArrivalStatus;
    dietaryRestrictions: string[];
    allergies?: string | null;
    beveragePreferences?: string | null;
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
  dietaryOtherDetails?: string;
  allergies?: string;
  beveragePreferences?: string;
  specialNotes?: string;
}

export type UpdateManifestGuestDto = Partial<CreateManifestGuestDto>;

export interface UpdatePrimaryDetailsDto {
  roomNumber?: number | null;
  dietaryRestrictions?: string[];
  allergies?: string | null;
  beveragePreferences?: string | null;
}

export interface UpdateArrivalStatusDto {
  status: import('./bookings').GuestArrivalStatus;
}

export interface UpsertManifestDraftDto {
  data: Record<string, unknown>;
  guestId?: string;
}

export interface ManifestDraftResponse {
  bookingId: string;
  data: Record<string, unknown>;
  guestId?: string | null;
  updatedAt: string;
}

export interface ManifestOptionItem {
  value: string;
  label: string;
}

export interface ManifestOptionsResponse {
  dietaryRestrictions: ManifestOptionItem[];
  relationships: ManifestOptionItem[];
}

export interface ChefsBriefResponse {
  bookingId: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  generatedAt: string;
  summary: {
    totalRestrictions: number;
    totalAllergies: number;
    totalBeveragePrefs: number;
  };
  /** Dietary restriction → list of guest names with it */
  dietaryRestrictions: Record<string, string[]>;
  allergies: { guest: string; allergy: string }[];
  beveragePreferences: { guest: string; preference: string }[];
  guestBreakdown: {
    name: string;
    dietaryRestrictions: string[];
    allergies?: string | null;
    beveragePreferences?: string | null;
    room: string;
  }[];
}
