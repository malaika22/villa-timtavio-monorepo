import type { CrmNote } from './crm';
import type { BookingStatus, ManifestStatus, RoomType } from './bookings';

export type GuestRole = 'PRIMARY' | 'SECONDARY';

export type { RoomType };

export interface GuestSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: GuestRole;
  beveragePreferences?: string | null;
  winePreferences?: string | null;
  dietaryRestrictions: string[];
  allergies?: string | null;
  favouriteExperiences: string[];
  preferredTimes?: string | null;
  dateOfBirth?: string | null;
  specialOccasions?: string | null;
  preferredRoomType?: RoomType | null;
  pillarPreferences?: string | null;
  totalVisits: number;
  totalSpend: number;
  firstStayDate?: string | null;
  lastStayDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSummaryForGuest {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: BookingStatus;
  manifestStatus: ManifestStatus;
  totalGuests: number;
  primaryRoomNumber?: number | null;
}

export interface GuestWithBookings extends GuestSummary {
  primaryBookings: BookingSummaryForGuest[];
}

/** A folio line as the profile endpoint returns it. Decimal on the wire. */
export interface FolioItemForGuest {
  id: string;
  description: string;
  amount: string;
  quantity: number;
}

export interface ExperienceRequestForGuest {
  id: string;
  preferredDate: string;
  confirmedDate?: string | null;
  status:
    | 'PENDING'
    | 'CONFLICT'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'READY'
    | 'COMPLETED'
    | 'CANCELLED';
  catalogItem?: { name?: string | null } | null;
}

/**
 * What `/guests/:id/profile` actually sends back per booking.
 *
 * The endpoint includes folio items and experience requests and always has —
 * it sums the folio to work out lifetime spend. Only the type stopped short,
 * so the dashboard believed a guest's stay history and their booked
 * experiences were unavailable and rendered "none on file" for both.
 */
export interface BookingDetailForGuest extends BookingSummaryForGuest {
  folioItems?: FolioItemForGuest[];
  experienceRequests?: ExperienceRequestForGuest[];
}

export interface GuestProfileStats {
  totalVisits: number;
  lifetimeSpend: number;
  firstStay?: string | null;
  lastStay?: string | null;
}

export interface GuestProfile extends GuestSummary {
  primaryBookings: BookingDetailForGuest[];
  crmNotes: CrmNote[];
  stats: GuestProfileStats;
  preStockSuggestions: {
    type: string;
    description: string;
    source: string;
  }[];
}

export interface UpdateGuestDnaDto {
  beveragePreferences?: string;
  winePreferences?: string;
  dietaryRestrictions?: string[];
  allergies?: string;
  favouriteExperiences?: string[];
  preferredTimes?: string;
  specialOccasions?: string;
  pillarPreferences?: string;
}
