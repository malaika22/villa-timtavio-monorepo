import type { Vendor } from '@repo/api-types';
import type { VendorRoiRow } from '@/types';

export function mapVendorToRoiRow(vendor: Vendor): VendorRoiRow {
  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.catalogItems?.[0]?.category ?? '—',
    bookings: vendor.totalBookings,
    grossRevenue: 'n/a',
    vendorCost: 'n/a',
    netMargin: 'n/a',
    roi: 0,
    roiLabel: 'n/a',
    rating: vendor.averageRating ?? 0,
    declined: 0,
    declinedPercent: 0,
    status: vendor.status === 'ACTIVE' ? 'Active' : 'Review',
  };
}
