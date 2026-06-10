export interface CrmNote {
  id: string;
  guestId: string;
  note: string;
  addedBy: string;
  isStale: boolean;
  createdAt: string;
}

export interface CreateCrmNoteDto {
  note: string;
}

export interface AddBeveragePreferenceDto {
  category: string;
  item: string;
  notes?: string;
}

export interface PreStockSuggestion {
  type: string;
  description: string;
  source: string;
}

export interface ExperienceHistoryItem {
  id: string;
  title: string;
  status: string;
  requestedDate?: string | null;
  scheduledDate?: string | null;
  amount?: number | null;
}
