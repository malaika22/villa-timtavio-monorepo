import { useQuery } from '@tanstack/react-query';
import { ownerVendorsApi } from '@/lib/api/vendors';
import { analyticsApi } from '@/lib/api/analytics';
import { mapVendorToRoiRow } from '@/lib/mappers/vendor';
import type { VendorRoiRow } from '@/types';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const CATEGORY_LABEL: Record<string, string> = {
  CULINARY_AGAVE: 'Culinary',
  WELLNESS: 'Wellness',
  OCEAN_ADVENTURE: 'Water Sports',
  ARRIVAL_TRANSIT: 'Transport',
  EXCURSIONS: 'Excursion',
  PRIVATE: 'Private',
  INCLUDED: 'Included',
  GENERAL: '—',
};

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: ownerVendorsApi.list,
    staleTime: 60_000,
  });
}

// Real ROI rows from the analytics vendor performance endpoint. Vendor cost is
// modelled at a 55% concierge split (gross − cost = net margin).
export function useVendorsAsRoiRows() {
  return useQuery({
    queryKey: ['analytics', 'vendors', 'roi'],
    queryFn: analyticsApi.vendors,
    staleTime: 60_000,
    select: (rows): VendorRoiRow[] =>
      rows.map((v) => {
        const gross = v.revenue;
        const cost = gross * 0.55;
        const net = gross - cost;
        const roi = cost > 0 ? Math.round((net / cost) * 100) : 0;
        return {
          id: v.id,
          name: v.name,
          category: CATEGORY_LABEL[v.category] ?? v.category,
          bookings: v.bookings,
          grossRevenue: gross > 0 ? money(gross) : '—',
          vendorCost: gross > 0 ? money(cost) : '—',
          netMargin: gross > 0 ? money(net) : '—',
          roi,
          roiLabel: gross > 0 ? `${roi}%` : '—',
          rating: v.rating,
          declined: 0,
          declinedPercent: 0,
          status: v.status === 'ACTIVE' ? 'Active' : 'Review',
        };
      }),
  });
}

export { mapVendorToRoiRow };
