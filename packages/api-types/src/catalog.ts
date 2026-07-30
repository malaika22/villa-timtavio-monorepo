import type { PriceUnit } from './pricing';

export type CatalogCategory =
  | 'INCLUDED'
  | 'ARRIVAL_TRANSIT'
  | 'WELLNESS'
  | 'CULINARY_AGAVE'
  | 'OCEAN_ADVENTURE'
  | 'EXCURSIONS'
  | 'PRIVATE';

export type MenuCategory =
  | 'BREAKFAST'
  | 'LUNCH'
  | 'DINNER'
  | 'SNACKS'
  | 'BEVERAGES';

export interface ExperienceCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  experienceCategoryId?: string | null;
  experienceCategory?: ExperienceCategorySummary | null;
  description: string;
  shortDescription?: string | null;
  isIncluded: boolean;
  isActive: boolean;
  durationMinutes?: number | null;
  durationLabel?: string | null;
  photoUrls: string[];
  primaryPhotoUrl?: string | null;
  /** Estimated rate — the single estimate, or the low end when priceMax is set. */
  basePrice?: number | null;
  /** High end of a published estimate range. Null for a single estimate. */
  priceMax?: number | null;
  priceUnitId?: string | null;
  priceUnit?: PriceUnit | null;
  isMultiDay: boolean;
  multiDayDuration?: number | null;
  availableTimeSlots: string[];
  maxGuestCount?: number | null;
  setupLeadTimeMinutes?: number | null;
  included: string[];
  hostName?: string | null;
  hostTitle?: string | null;
  hostAvatarUrl?: string | null;
  hostReviewNote?: string | null;
  vendorId?: string | null;
  vendor?: { id: string; name: string; status: string } | null;
  /** Breezeway person id this experience's setup task is assigned to. */
  breezeWayTeamId?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItemDetail extends CatalogItem {
  experienceRequests?: { id: string; status: string }[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  containsNuts: boolean;
  containsDairy: boolean;
  containsShellfish: boolean;
  otherDietaryNotes?: string | null;
  sortOrder: number;
}

export interface Recommendation {
  id: string;
  name: string;
  category: string;
  location?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  externalUrl?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface CreateCatalogItemDto {
  name: string;
  category: CatalogCategory;
  description: string;
  shortDescription?: string;
  isIncluded?: boolean;
  isActive?: boolean;
  durationMinutes?: number;
  durationLabel?: string;
  photoUrls?: string[];
  primaryPhotoUrl?: string;
  isMultiDay?: boolean;
  multiDayDuration?: number;
  availableTimeSlots?: string[];
  maxGuestCount?: number;
  setupLeadTimeMinutes?: number;
  vendorId?: string;
  experienceCategoryId?: string;
  basePrice?: number;
  /** High end of an estimate range. Omit for a single estimate. */
  priceMax?: number;
  priceUnitId?: string;
  /** Breezeway person id to assign this experience's setup task to. */
  breezeWayTeamId?: string;
  sortOrder?: number;
  included?: string[];
  hostName?: string;
  hostTitle?: string;
  hostAvatarUrl?: string;
  hostReviewNote?: string;
}

export interface UpdateCatalogItemDto extends Partial<CreateCatalogItemDto> {}
