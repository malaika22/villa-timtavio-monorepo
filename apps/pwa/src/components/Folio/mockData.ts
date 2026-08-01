export type FolioItemCategory = 'villa' | 'experience' | 'incidental';

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
  breakdown: { villa: number; experiences: number; incidentals: number };
  paymentInfo: string;
  totals: FolioTotals;
  items: FolioItem[];
  /** Stay has been checked out → receipt/read-only mode. */
  checkedOut?: boolean;
}

export const FOLIO_MOCK: FolioMeta = {
  breakdown: {
    villa: 12450,
    experiences: 750,
    incidentals: 440,
  },
  paymentInfo: '···· 4242 Visa',
  totals: {
    subtotal: 13640,
    taxRate: 0.16,
    taxLabel: 'IVA Tax (16%)',
  },
  items: [
    {
      id: 1,
      category: 'villa',
      title: 'Villa Azul — Base Rate',
      amount: 12450,
      meta: '4 NIGHTS · MAR 20–24',
      date: 'MAR 20',
    },
    {
      id: 2,
      category: 'experience',
      title: "Chef's Table Dinner",
      amount: 450,
      meta: 'MAR 21 · 6PM · CHEF BILLY',
      date: 'MAR 21',
      description:
        '8-course tasting menu with wine pairing. Completed poolside terrace.',
      staffNote: '"Guest requested additional champagne at 9pm."',
      showViewStatus: true,
    },
    {
      id: 3,
      category: 'incidental',
      title: 'Caymus Cabernet ×2',
      amount: 240,
      meta: 'MAR 20 · POOLSIDE VERBAL ORDER',
      date: 'MAR 20',
    },
    {
      id: 4,
      category: 'experience',
      title: 'Pool Exclusive',
      amount: 300,
      meta: 'MAR 21 · 7PM · 3 HRS',
      date: 'MAR 21',
    },
  ],
};

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
