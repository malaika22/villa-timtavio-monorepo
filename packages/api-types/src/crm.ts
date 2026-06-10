import type { ExperienceRequest } from './requests';

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

export interface AddDietaryRestrictionDto {
  restriction: string;
}

export interface PreStockSuggestion {
  type: string;
  description: string;
  source: string;
}

export interface ExperienceHistoryItem
  extends Pick<
    ExperienceRequest,
    | 'id'
    | 'status'
    | 'preferredDate'
    | 'confirmedDate'
    | 'confirmedCost'
    | 'createdAt'
  > {
  catalogItemName: string;
  catalogItemCategory: string;
}
