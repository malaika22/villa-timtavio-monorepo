export type FolioItemType =
  | 'ESTATE_BASE_RATE'
  | 'EXPERIENCE'
  | 'INCIDENTAL'
  | 'PRE_STOCKED';

export interface FolioItem {
  id: string;
  bookingId: string;
  type: FolioItemType;
  description: string;
  amount: number;
  quantity: number;
  attributedToEmail?: string | null;
  attributedToName?: string | null;
  staffNote?: string | null;
  loggedBy: string;
  loggedAt: string;
  editableUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolioSummary {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceChargeRate: number;
  serviceAmount: number;
  grandTotal: number;
}

export interface FolioByType {
  ESTATE_BASE_RATE: FolioItem[];
  EXPERIENCE: FolioItem[];
  INCIDENTAL: FolioItem[];
  PRE_STOCKED: FolioItem[];
}

/**
 * One party member's share of the folio. Pre-tax charges only — tax and service
 * are levied on the folio as a whole, not per guest — and financial only, so
 * included experiences don't appear. Totals reconcile to `summary.subtotal`.
 */
export interface FolioGuestSpend {
  email: string;
  name: string;
  isPrimary: boolean;
  total: number;
  itemCount: number;
}

export interface FolioResponse {
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    status: string;
    taxRate: number;
    serviceChargeRate: number;
  };
  items: FolioItem[];
  byType: FolioByType;
  /** Spend per party member, so the primary can charge each guest independently. */
  byGuest: FolioGuestSpend[];
  summary: FolioSummary;
}

export interface CreateFolioItemDto {
  type: FolioItemType;
  description: string;
  amount: number;
  quantity?: number;
  attributedToEmail?: string;
  attributedToName?: string;
  staffNote?: string;
}

export interface UpdateFolioItemDto extends Partial<CreateFolioItemDto> {}
