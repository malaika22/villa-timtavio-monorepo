import type { CrmNote } from './crm';

export type GuestRole = 'PRIMARY' | 'SECONDARY';

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
  createdAt: string;
  updatedAt: string;
}

export interface GuestProfileStats {
  totalVisits: number;
  lifetimeSpend: number;
  firstStay?: string | null;
  lastStay?: string | null;
}

export interface GuestProfile extends GuestSummary {
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
