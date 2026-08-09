'use client';
import { useFolio } from '@/hooks/useFolio';
import { mapFolioItemToUI, mapFolioResponseToMeta } from '@/lib/mappers/folio';
import { FolioHeader } from './FolioHeader';
import { FolioLineItems } from './FolioLineItems';
import type { FolioItem, FolioMeta } from './mockData';
import { LoadFailed } from '@/components/LoadFailed';

export const Folio = () => {
  const { data: folioData, isLoading, isError, refetch, isFetching } =
    useFolio();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="h-48 skeleton rounded-[12px] bg-[#E3E0DA]" />
        <div className="h-64 skeleton rounded-[12px] bg-[#E3E0DA]" />
      </div>
    );
  }

  // A bill is the one screen that must never invent a number. This fell back
  // to FOLIO_MOCK whenever the request failed, so an error, a 401 or a plane
  // showed the guest a plausible folio of money nobody owed.
  if (isError || !folioData) {
    return (
      <LoadFailed
        what="your folio"
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  const folioMeta: FolioMeta = (() => {
    const meta = mapFolioResponseToMeta(folioData);
    const items: FolioItem[] = folioData.items.map(mapFolioItemToUI);

    const checkedOut = folioData.booking.status === 'CHECKED_OUT';

    return {
      breakdown: {
        villa: meta.villaTotal,
        experiences: meta.experiencesTotal,
        dining: meta.diningTotal,
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
  })();

  return (
    <div className="flex flex-1 flex-col">
      <FolioHeader data={folioMeta} />
      <FolioLineItems data={folioMeta} byGuest={folioData?.byGuest} />
    </div>
  );
};
