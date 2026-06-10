export interface FolioItem {
  id: string;
  bookingId: string;
  label: string;
  category: string;
  amount: number;
  quantity: number;
  date?: string | null;
  createdAt: string;
}

export interface FolioSummary {
  bookingId: string;
  items: FolioItem[];
  subtotal: number;
  taxes?: number;
  total: number;
  currency?: string;
}
