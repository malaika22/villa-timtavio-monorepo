'use client';
import { useFolio } from '@/hooks/useFolio';
import { mapFolioItemToUI, mapFolioResponseToMeta } from '@/lib/mappers/folio';
import { FolioHeader } from './FolioHeader';
import { FolioLineItems } from './FolioLineItems';
import type { FolioItem, FolioMeta as MockFolioMeta } from './mockData';
import { FOLIO_MOCK } from './mockData';

export const Folio = () => {
  const { data: folioData, isLoading } = useFolio();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="h-48 animate-pulse rounded-[12px] bg-[#E3E0DA]" />
        <div className="h-64 animate-pulse rounded-[12px] bg-[#E3E0DA]" />
      </div>
    );
  }

  let folioMeta: MockFolioMeta = FOLIO_MOCK;

  if (folioData) {
    const meta = mapFolioResponseToMeta(folioData);
    const items: FolioItem[] = folioData.items.map(mapFolioItemToUI);

    const checkedOut = folioData.booking.status === 'CHECKED_OUT';

    folioMeta = {
      breakdown: {
        villa: meta.villaTotal,
        experiences: meta.experiencesTotal,
        incidentals: meta.incidentalsTotal,
      },
      paymentInfo: checkedOut ? 'Payment complete' : 'Auto-charged at checkout',
      checkedOut,
      totals: {
        subtotal: meta.subtotal,
        taxRate: meta.taxRate,
        taxLabel: `IVA Tax (${(meta.taxRate * 100).toFixed(0)}%)`,
        taxAmount: meta.taxAmount,
        serviceAmount: meta.serviceAmount,
        serviceLabel: `Service (${(meta.serviceChargeRate * 100).toFixed(0)}%)`,
        grandTotal: meta.grandTotal,
      },
      items,
    };
  }

  return (
    <div className="flex flex-1 flex-col">
      <FolioHeader data={folioMeta} />
      <FolioLineItems data={folioMeta} byGuest={folioData?.byGuest} />
    </div>
  );
};
