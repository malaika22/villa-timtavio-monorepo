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
  | 'BEVERAGES'
  /** The only chargeable category — the cellar and the reserve list. */
  | 'EXCLUSIVE';

/**
 * Where a dish sits on the estate's printed menu.
 *
 * A course belongs to exactly one meal, which is what lets an allowance attach
 * to it without ambiguity: three breakfast mains and one daily suggestion are
 * two separate allowances, not one allowance of four. Null for snacks,
 * beverages and exclusives — those are ordered on demand, not composed.
 */
export type MenuCourse =
  | 'BREAKFAST_MAIN'
  | 'BREAKFAST_SUGGESTION'
  | 'LUNCH_SELECTION'
  | 'DINNER_STARTER'
  | 'DINNER_MAIN'
  | 'DINNER_DESSERT';

export interface ExperienceCategorySummary {
  id: string;
  name: string;
  slug: string;
  /**
   * Which line drawing stands in for an experience here that has no photo.
   *
   * Null renders a neutral mark. Chosen by the estate rather than derived —
   * nothing infers a boat from "The Fleet".
   */
  glyph?: string | null;
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
  /**
   * Whether the estate's own staff prepare anything for this experience.
   * Off means no Breezeway setup task — and so no READY status, because
   * nothing was prepared.
   */
  needsSetupTask?: boolean;
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
  /** Which allowance this counts against when a party composes a day. */
  course?: MenuCourse | null;
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
  /**
   * Whether this belongs to the curated library. A one-off written for a single
   * service keeps its photo and dietary flags but never joins the menu proper.
   */
  isStanding?: boolean;
  /**
   * Set only on EXCLUSIVE items — everything else is included in the stay.
   * A Decimal column, so coerce before doing arithmetic with it.
   */
  price?: number | null;
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
  /** Null clears the cover. Undefined leaves whatever is stored alone. */
  primaryPhotoUrl?: string | null;
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
  needsSetupTask?: boolean;
  sortOrder?: number;
  included?: string[];
  hostName?: string;
  hostTitle?: string;
  hostAvatarUrl?: string;
  hostReviewNote?: string;
}

export interface UpdateCatalogItemDto extends Partial<CreateCatalogItemDto> {}
