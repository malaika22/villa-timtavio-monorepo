import type { CatalogItem } from '@repo/api-types';
import type { ExperiencePerformanceRow } from '@/types';

export function mapCatalogItemToPerformanceRow(
  item: CatalogItem,
): ExperiencePerformanceRow {
  return {
    id: item.id,
    name: item.name,
    bookings: 0,
    revenue: 'n/a',
    rating: 0,
    declined: 0,
    declinedPercent: 0,
    trend: '—',
    trendDirection: 'neutral',
  };
}
