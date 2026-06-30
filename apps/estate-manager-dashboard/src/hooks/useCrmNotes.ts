'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api/crm';

export function useCrmNotes(guestId: string) {
  return useQuery({
    queryKey: ['crm', guestId, 'notes'],
    queryFn: () => crmApi.getNotes(guestId),
    enabled: !!guestId,
  });
}

export function useAddCrmNote(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => crmApi.addNote(guestId, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', guestId, 'notes'] });
    },
  });
}

export function useMarkNoteStale(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => crmApi.markNoteStale(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', guestId, 'notes'] });
    },
  });
}

export function useAddBeveragePreference(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: string) =>
      crmApi.addBeveragePreference(guestId, { category: 'GENERAL', item }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['guests', guestId, 'profile'],
      });
    },
  });
}

export function useAddDietaryRestriction(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restriction: string) =>
      crmApi.addDietaryRestriction(guestId, restriction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['guests', guestId, 'profile'],
      });
    },
  });
}
