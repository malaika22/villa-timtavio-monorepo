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

const SLUG_TO_UI_CATEGORY: Record<string, ContentExperienceCategory> = {
  dining: 'dining',
  water: 'water',
  wellness: 'wellness',
  wine: 'wine',
  culture: 'culture',
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

function resolveUiCategory(item: CatalogItem): ContentExperienceCategory {
  const slug = item.experienceCategory?.slug;
  if (slug && SLUG_TO_UI_CATEGORY[slug]) {
    return SLUG_TO_UI_CATEGORY[slug]!;
  }
  return CATEGORY_MAP[item.category] ?? 'culture';
}

export function mapCatalogItemToContentExperience(
  item: CatalogItem,
): ContentExperience {
  const category = resolveUiCategory(item);
  const categoryLabel =
    item.experienceCategory?.name ??
    CATEGORY_LABEL[item.category] ??
    item.category;

  return {
    id: item.id,
    name: item.name,
    category,
    categoryLabel,
    categorySlug: item.experienceCategory?.slug,
    experienceCategoryId: item.experienceCategoryId,
    description: item.description,
    pricing: item.isIncluded ? 'included' : 'chargeable',
    active: item.isActive,
    capacity: item.maxGuestCount ? `Up to ${item.maxGuestCount} pax` : '—',
    duration:
      item.durationLabel ??
      (item.durationMinutes ? `${item.durationMinutes} min` : '—'),
    durationMinutes: item.durationMinutes,
    basePrice: item.basePrice != null ? Number(item.basePrice) : null,
    priceMax: item.priceMax != null ? Number(item.priceMax) : null,
    priceUnitId: item.priceUnitId ?? null,
    priceUnit: item.priceUnit ?? null,
    vendorId: item.vendorId,
    breezeWayTeamId: item.breezeWayTeamId ?? null,
    needsSetupTask: item.needsSetupTask ?? true,
    primaryPhotoUrl: item.primaryPhotoUrl,
    photoUrls: item.photoUrls ?? [],
    maxGuestCount: item.maxGuestCount,
    included: item.included ?? [],
    hostName: item.hostName,
    hostTitle: item.hostTitle,
    hostAvatarUrl: item.hostAvatarUrl,
    hostReviewNote: item.hostReviewNote,
    imageTone: item.isActive ? IMAGE_TONE_MAP[category] : 'inactive',
  };
}
