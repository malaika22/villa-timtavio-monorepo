import type { CatalogItem, CatalogCategory } from '@repo/api-types';
import type {
  Experience,
  ExperienceFilterId,
  ExperienceCatalogFilter,
  ExperienceDetailData,
  ExperienceTimeSlot,
} from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import type { BookingStatus } from '@repo/api-types';

const CATEGORY_TO_FILTER: Record<CatalogCategory, ExperienceFilterId> = {
  INCLUDED: 'all',
  ARRIVAL_TRANSIT: 'adventure',
  WELLNESS: 'wellness',
  CULINARY_AGAVE: 'culinary',
  OCEAN_ADVENTURE: 'water',
  EXCURSIONS: 'adventure',
  PRIVATE: 'private',
};

const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  INCLUDED: 'Included',
  ARRIVAL_TRANSIT: 'Arrival',
  WELLNESS: 'Wellness',
  CULINARY_AGAVE: 'Culinary',
  OCEAN_ADVENTURE: 'Water',
  EXCURSIONS: 'Excursions',
  PRIVATE: 'Private',
};

/**
 * Experiences are browsable and requestable from the moment the booking
 * exists. They used to be locked until the estate manager set the booking to
 * CHECKED_IN — which made the catalogue useless during exactly the weeks a
 * guest is deciding what to do with their stay. Planning ahead is now the
 * point of the portal, so there is nothing left to gate on.
 *
 * Access itself is the boundary: a magic link is only issued for a live
 * booking and is revoked 24 hours after checkout.
 */
export function mapCatalogItemToExperience(item: CatalogItem): Experience {
  const status = ExperienceStatus.AVAILABLE;

  return {
    id: item.id,
    // Guest-facing category = the dynamic EM/CSV category (WYSIWYG), falling
    // back to the enum label only for legacy items without an assigned category.
    category:
      item.experienceCategory?.name ??
      CATEGORY_LABEL[item.category] ??
      item.category,
    filterCategory:
      item.experienceCategory?.name ??
      (CATEGORY_TO_FILTER[item.category] as string) ??
      'all',
    title: item.name,
    durationMinutes: item.durationMinutes ?? undefined,
    // No stock photograph. The card draws the category's mark instead, which
    // is honest about not having a picture rather than showing one of
    // somewhere else.
    image: item.primaryPhotoUrl ?? item.photoUrls[0] ?? '',
    glyph: item.experienceCategory?.glyph ?? null,
    status,
    rate: {
      basePrice: item.basePrice ?? null,
      priceMax: item.priceMax ?? null,
      priceUnit: item.priceUnit ?? null,
    },
    isIncluded: item.isIncluded,
  };
}

export function mapCatalogItemsToExperiences(
  items: CatalogItem[],
): Experience[] {
  return items.map((item) => mapCatalogItemToExperience(item));
}

function slotLabel(time: string): string {
  const hour = parseInt(time.split(':')[0] ?? '', 10);
  if (Number.isNaN(hour)) return time;
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function mapTimeSlots(slots: string[]): ExperienceTimeSlot[] {
  return slots.map((slot, i) => {
    const isClockTime = /\d{1,2}:\d{2}/.test(slot);
    return {
      id: `slot-${i}`,
      label: isClockTime ? slotLabel(slot) : slot,
      time: slot,
    };
  });
}

/**
 * Builds the experience detail view from an EM-managed catalog item, so the
 * request/detail screens reflect real dashboard data rather than mock content.
 */
export function mapCatalogItemToDetail(
  item: CatalogItem,
): ExperienceDetailData {
  const images =
    item.photoUrls.length > 0
      ? item.photoUrls
      : item.primaryPhotoUrl
        ? [item.primaryPhotoUrl]
        : undefined;

  const about = item.shortDescription?.trim() || item.description;
  const longDescription =
    item.shortDescription && item.description !== item.shortDescription
      ? item.description
      : undefined;

  const times = item.availableTimeSlots?.length
    ? mapTimeSlots(item.availableTimeSlots)
    : undefined;

  // Prefer the explicit host fields; fall back to the linked vendor.
  const hostName = item.hostName ?? item.vendor?.name;
  const host = hostName
    ? {
        name: hostName,
        role: item.hostTitle ?? 'Provider',
        category: CATEGORY_LABEL[item.category] ?? item.category,
        // The host's avatar keeps its fallback: a face is a different promise
        // from a scene, and an empty circle beside a name reads as a fault.
        avatar:
          item.hostAvatarUrl ?? item.primaryPhotoUrl ?? item.photoUrls[0] ?? '',
        reviewNote: item.hostReviewNote ?? undefined,
      }
    : undefined;

  return {
    images,
    about,
    longDescription,
    included: item.included ?? [],
    host,
    availableTimes: times,
    maxGuests: item.maxGuestCount ?? undefined,
    basePrice: item.basePrice ?? 0,
    priceUnit: item.priceUnit?.shortLabel ?? undefined,
    // Guests see this as an estimate; the concierge confirms the hard quote.
    rate: {
      basePrice: item.basePrice ?? null,
      priceMax: item.priceMax ?? null,
      priceUnit: item.priceUnit ?? null,
    },
    isIncluded: item.isIncluded,
  };
}
