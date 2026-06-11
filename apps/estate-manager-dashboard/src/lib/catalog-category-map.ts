import type { CatalogCategory } from '@repo/api-types';

export function slugToCatalogCategory(slug: string): CatalogCategory {
  const map: Record<string, CatalogCategory> = {
    dining: 'CULINARY_AGAVE',
    water: 'OCEAN_ADVENTURE',
    wellness: 'WELLNESS',
    wine: 'CULINARY_AGAVE',
    culture: 'EXCURSIONS',
  };

  return map[slug] ?? 'PRIVATE';
}

export function formatDurationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} min`;
}
