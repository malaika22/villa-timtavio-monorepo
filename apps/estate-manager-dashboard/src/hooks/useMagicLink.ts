'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { emMagicLinkApi } from '@/lib/api/magic-link';

export function useSendMagicLink() {
  return useMutation({
    mutationFn: (bookingId: string) => emMagicLinkApi.send(bookingId),
    onSuccess: (data) => {
      toast.success('Magic link sent', {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to send magic link', {
        description: error.message,
      });
    },
  });
}
