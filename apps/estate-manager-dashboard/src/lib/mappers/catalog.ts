import type { CatalogItem, CatalogCategory } from '@repo/api-types';
import type { ContentExperience, ContentExperienceCategory } from '@/types';

const CATEGORY_MAP: Record<CatalogCategory, ContentExperienceCategory> = {
  INCLUDED: 'dining',
  ARRIVAL_TRANSIT: 'culture',
  WELLNESS: 'wellness',
  CULINARY_AGAVE: 'dining',
  OCEAN_ADVENTURE: 'water',
  EXCURSIONS: 'culture',
  PRIVATE: 'culture',
};

const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  INCLUDED: 'Included',
  ARRIVAL_TRANSIT: 'Arrival & Transit',
  WELLNESS: 'Wellness',
  CULINARY_AGAVE: 'Culinary & Agave',
  OCEAN_ADVENTURE: 'Ocean & Adventure',
  EXCURSIONS: 'Excursions',
  PRIVATE: 'Private',
};

const IMAGE_TONE_MAP: Record<
  ContentExperienceCategory,
  ContentExperience['imageTone']
> = {
  dining: 'dining',
  water: 'water',
  wellness: 'wellness',
  wine: 'wine',
  culture: 'culture',
};

export function mapCatalogItemToContentExperience(
  item: CatalogItem,
): ContentExperience {
  const category = CATEGORY_MAP[item.category] ?? 'culture';
  return {
    id: item.id,
    name: item.name,
    category,
    categoryLabel: CATEGORY_LABEL[item.category] ?? item.category,
    pricing: item.isIncluded ? 'included' : 'chargeable',
    active: item.isActive,
    capacity: item.maxGuestCount ? `${item.maxGuestCount} guests` : '—',
    duration:
      item.durationLabel ??
      (item.durationMinutes ? `${item.durationMinutes} min` : '—'),
    imageTone: item.isActive ? IMAGE_TONE_MAP[category] : 'inactive',
  };
}
