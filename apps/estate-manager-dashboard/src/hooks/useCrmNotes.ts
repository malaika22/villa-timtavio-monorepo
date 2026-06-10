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
