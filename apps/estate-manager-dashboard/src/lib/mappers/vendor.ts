import type { Vendor } from '@repo/api-types';
import type { VendorProfile, VendorCategory } from '@/types';

function inferCategory(vendor: Vendor): VendorCategory {
  const desc = (vendor.serviceDescription ?? '').toLowerCase();
  if (
    desc.includes('culinary') ||
    desc.includes('chef') ||
    desc.includes('dining')
  )
    return 'culinary';
  if (
    desc.includes('wellness') ||
    desc.includes('spa') ||
    desc.includes('yoga')
  )
    return 'wellness';
  if (
    desc.includes('water') ||
    desc.includes('ocean') ||
    desc.includes('diving')
  )
    return 'water-sports';
  if (desc.includes('marine') || desc.includes('boat')) return 'marine';
  if (desc.includes('entertainment') || desc.includes('music'))
    return 'entertainment';
  if (desc.includes('transport') || desc.includes('transfer'))
    return 'transport';
  // Default based on catalog items
  if (vendor.catalogItems?.some((i) => i.category === 'WELLNESS'))
    return 'wellness';
  if (vendor.catalogItems?.some((i) => i.category === 'CULINARY_AGAVE'))
    return 'culinary';
  if (vendor.catalogItems?.some((i) => i.category === 'OCEAN_ADVENTURE'))
    return 'water-sports';
  return 'entertainment';
}

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  culinary: 'Culinary',
  wellness: 'Wellness',
  'water-sports': 'Water Sports',
  marine: 'Marine',
  entertainment: 'Entertainment',
  transport: 'Transport',
};

export function mapVendorToProfile(vendor: Vendor): VendorProfile {
  const category = inferCategory(vendor);
  const catalogItemNames = (vendor.catalogItems ?? [])
    .map((i) => i.name)
    .slice(0, 5);

  return {
    id: vendor.id,
    name: vendor.name,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    rating: vendor.averageRating ?? 0,
    lead: vendor.contactName ?? '—',
    location: '—',
    description: vendor.serviceDescription ?? '',
    serviceTags:
      catalogItemNames.length > 0
        ? catalogItemNames
        : [CATEGORY_LABEL[category]],
    totalBookings: vendor.totalBookings,
    avgRating: vendor.averageRating ?? 0,
    avgBooking: '—',
  };
}
