import type {
  AddBeveragePreferenceDto,
  CreateCrmNoteDto,
  CrmNote,
  ExperienceHistoryItem,
  PreStockSuggestion,
} from '@repo/api-types';

import { API, api } from '@/lib/api';

export const crmApi = {
  getNotes: (guestId: string) => api.get<CrmNote[]>(API.crm.notes(guestId)),

  addNote: (guestId: string, dto: CreateCrmNoteDto) =>
    api.post<CrmNote>(API.crm.notes(guestId), dto),

  markNoteStale: (noteId: string) =>
    api.patch<CrmNote>(API.crm.noteStale(noteId)),

  addBeveragePreference: (guestId: string, dto: AddBeveragePreferenceDto) =>
    api.post(API.crm.beveragePreference(guestId), dto),

  addDietaryRestriction: (guestId: string, restriction: string) =>
    api.post(API.crm.dietaryRestriction(guestId), { restriction }),

  getPreStockSuggestions: (guestId: string) =>
    api.get<PreStockSuggestion[]>(API.crm.preStockSuggestions(guestId)),

  getExperienceHistory: (guestId: string) =>
    api.get<{
      requests: ExperienceHistoryItem[];
      topExperiences: { name: string; count: number }[];
      totalCompleted: number;
    }>(API.crm.experienceHistory(guestId)),
};
