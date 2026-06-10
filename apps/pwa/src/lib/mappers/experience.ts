import type { CatalogItem, CatalogCategory } from '@repo/api-types';
import type {
  Experience,
  ExperienceFilterId,
  ExperienceCatalogFilter,
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
