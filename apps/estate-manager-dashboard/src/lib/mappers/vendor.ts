import type { Vendor, CatalogCategory } from '@repo/api-types';
import type { VendorProfile, VendorCategory } from '@/types';

const API_CATEGORY_MAP: Record<CatalogCategory, VendorCategory> = {
  CULINARY_AGAVE: 'culinary',
  WELLNESS: 'wellness',
  OCEAN_ADVENTURE: 'water-sports',
  ARRIVAL_TRANSIT: 'transport',
  EXCURSIONS: 'entertainment',
  PRIVATE: 'entertainment',
  INCLUDED: 'culinary',
};

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  culinary: 'Culinary',
  wellness: 'Wellness',
  'water-sports': 'Water Sports',
  marine: 'Marine',
  entertainment: 'Entertainment',
  transport: 'Transport',
};

export function mapVendorToProfile(vendor: Vendor): VendorProfile {
  const category = API_CATEGORY_MAP[vendor.category] ?? 'entertainment';
  const catalogItemNames = (vendor.catalogItems ?? [])
    .map((item) => item.name)
    .slice(0, 5);

  return {
    id: vendor.id,
    name: vendor.name,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    rating: Number(vendor.averageRating ?? 0),
    lead: vendor.role,
    location: '—',
    description: vendor.bio ?? '',
    serviceTags:
      catalogItemNames.length > 0
        ? catalogItemNames
        : [CATEGORY_LABEL[category]],
    totalBookings: vendor.totalBookings,
    avgRating: Number(vendor.averageRating ?? 0),
    avgBooking: '—',
    status: vendor.status,
  };
}
