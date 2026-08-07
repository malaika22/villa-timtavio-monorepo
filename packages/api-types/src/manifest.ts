import type { ManifestGuest, GuestArrivalStatus } from './bookings';

export type { ManifestGuest };

export interface ManifestResponse {
  bookingId: string;
  manifestStatus: 'INCOMPLETE' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED';
  totalGuests: number;
  addedGuests: number;
  progressPercent: number;
  /**
   * Whether the primary has finished their own entry — currently, whether a
   * room is assigned. False means the manifest is incomplete however many
   * secondaries have been added.
   */
  primaryComplete?: boolean;
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
    /** The primary's own experience requests (for the party hub). */
    experiences?: import('./bookings').GuestExperienceSummary[];
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

/**
 * What the estate's own manifest form calls each dietary value.
 *
 * The values are stored as they're posted — `no_nuts`, `gluten_free` — which
 * is fine in a database and wrong on a run sheet a chef reads at speed.
 */
export const DIETARY_RESTRICTION_LABELS: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten-free',
  halal: 'Halal',
  kosher: 'Kosher',
  no_shellfish: 'No shellfish',
  no_nuts: 'No nuts',
  no_dairy: 'No dairy',
  other: 'Other',
};

/** Falls back to the raw value rather than hiding a restriction we don't know. */
export const dietaryLabel = (value: string): string =>
  DIETARY_RESTRICTION_LABELS[value] ??
  value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
