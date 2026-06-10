import type { FolioResponse, FolioItem as ApiFolioItem } from '@repo/api-types';
import type { FolioItem as UIFolioItem } from '@/components/Folio/mockData';

const TYPE_TO_CATEGORY: Record<string, UIFolioItem['category']> = {
  ESTATE_BASE_RATE: 'villa',
  EXPERIENCE: 'experience',
  INCIDENTAL: 'incidental',
  PRE_STOCKED: 'incidental',
};

export function mapFolioItemToUI(item: ApiFolioItem): UIFolioItem {
  return {
    id: item.id as unknown as number,
    title: item.description,
    category: TYPE_TO_CATEGORY[item.type] ?? 'incidental',
    amount: item.amount,
    date: item.loggedAt
      ? new Date(item.loggedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '',
    meta: item.attributedToName
      ? `BY ${item.attributedToName.toUpperCase()}`
      : item.loggedBy.toUpperCase(),
    staffNote: item.staffNote ?? undefined,
  };
}

export interface FolioMeta {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceChargeRate: number;
  serviceAmount: number;
  grandTotal: number;
  villaTotal: number;
  experiencesTotal: number;
  incidentalsTotal: number;
}

export function mapFolioResponseToMeta(folio: FolioResponse): FolioMeta {
  const { summary, byType } = folio;
  const villaTotal = byType.ESTATE_BASE_RATE.reduce((s, i) => s + i.amount, 0);
  const experiencesTotal = byType.EXPERIENCE.reduce((s, i) => s + i.amount, 0);
  const incidentalsTotal = [...byType.INCIDENTAL, ...byType.PRE_STOCKED].reduce(
    (s, i) => s + i.amount,
    0,
  );

  return {
    subtotal: summary.subtotal,
    taxRate: summary.taxRate,
    taxAmount: summary.taxAmount,
    serviceChargeRate: summary.serviceChargeRate,
    serviceAmount: summary.serviceAmount,
    grandTotal: summary.grandTotal,
    villaTotal,
    experiencesTotal,
    incidentalsTotal,
  };
}
