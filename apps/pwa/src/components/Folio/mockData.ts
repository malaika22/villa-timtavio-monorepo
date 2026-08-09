export type FolioItemCategory =
  | 'villa'
  | 'experience'
  /** Exclusive additions — the only chargeable part of dining. */
  | 'dining'
  | 'incidental';

export type FolioTabId = 'all' | 'by-type' | 'by-day' | 'by-guest';

export interface FolioItem {
  id: number;
  category: FolioItemCategory;
  title: string;
  amount: number;
  /** Upper-case meta line, e.g. "4 NIGHTS · MAR 20–24" */
  meta: string;
  /** ISO-style display date used for BY DAY grouping, e.g. "MAR 20" */
  date: string;
  description?: string;
  /** Italic staff note, shown below description */
  staffNote?: string;
  showViewStatus?: boolean;
}

export interface FolioTotals {
  subtotal: number;
  taxRate: number;
  taxLabel: string;
  taxAmount?: number;
  serviceAmount?: number;
  serviceLabel?: string;
  grandTotal?: number;
}

export interface FolioMeta {
  breakdown: {
    villa: number;
    experiences: number;
    dining: number;
    incidentals: number;
  };
  paymentInfo: string;
  totals: FolioTotals;
  items: FolioItem[];
  /** Stay has been checked out → receipt/read-only mode. */
  checkedOut?: boolean;
}

export const FOLIO_CATEGORY_CONFIG: Record<
  FolioItemCategory,
  { label: string; chip: string; dot?: string }
> = {
  villa: {
    label: 'VILLA',
    chip: 'border-[#C9C4BC] bg-[#F0EDE8] text-[#5C534A]',
  },
  experience: {
    label: 'EXPERIENCE',
    chip: 'border-[#3A5E4847] bg-[#3A5E4818] text-[#3A5E48]',
    dot: 'bg-[#3A5E48]',
  },
  dining: {
    label: 'DINING',
    chip: 'border-[#B08D5747] bg-[#B08D5718] text-[#8A6D3B]',
    dot: 'bg-[#B08D57]',
  },
  incidental: {
    label: 'INCIDENTAL',
    chip: 'border-[#C9C4BC] bg-[#F0EDE8] text-[#5C534A]',
  },
};

export const FOLIO_TABS: { id: FolioTabId; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'by-type', label: 'BY TYPE' },
  { id: 'by-day', label: 'BY DAY' },
  { id: 'by-guest', label: 'BY GUEST' },
];
