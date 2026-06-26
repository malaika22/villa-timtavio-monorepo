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

export function mapCatalogItemToExperience(
  item: CatalogItem,
  bookingStatus?: BookingStatus,
): Experience {
  const isPreArrival = bookingStatus === 'CONFIRMED';
  const isCheckedOut = bookingStatus === 'CHECKED_OUT';

  let status: ExperienceStatus;
  if (item.isIncluded) {
    status = isPreArrival
      ? ExperienceStatus.LOCKED_PRE_ARRIVAL
      : ExperienceStatus.AVAILABLE;
  } else if (isCheckedOut) {
    status = ExperienceStatus.AVAILABLE;
  } else {
    status = isPreArrival
      ? ExperienceStatus.LOCKED_PRE_ARRIVAL
      : ExperienceStatus.AVAILABLE;
  }

  return {
    id: item.id,
    category: CATEGORY_LABEL[item.category] ?? item.category,
    filterCategory:
      (CATEGORY_TO_FILTER[item.category] as ExperienceCatalogFilter) ?? 'all',
    title: item.name,
    durationMinutes: item.durationMinutes ?? undefined,
    image:
      item.primaryPhotoUrl ?? item.photoUrls[0] ?? '/images/experience.png',
    status,
  };
}

export function mapCatalogItemsToExperiences(
  items: CatalogItem[],
  bookingStatus?: BookingStatus,
): Experience[] {
  return items.map((item) => mapCatalogItemToExperience(item, bookingStatus));
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

  const host = item.vendor
    ? {
        name: item.vendor.name,
        role: 'Provider',
        category: CATEGORY_LABEL[item.category] ?? item.category,
        avatar:
          item.primaryPhotoUrl ??
          item.photoUrls[0] ??
          '/images/experience.png',
      }
    : undefined;

  return {
    images,
    about,
    longDescription,
    included: [],
    host,
    availableTimes: times,
    maxGuests: item.maxGuestCount ?? undefined,
    basePrice: item.basePrice ?? 0,
    priceUnit: 'per villa',
  };
}
