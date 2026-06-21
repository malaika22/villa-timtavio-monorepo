'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { toast } from 'sonner';

import { useDeleteInquiry } from '@/hooks/useInquiries';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiryId: string;
  guestName: string;
  guestEmail?: string;
  redirectOnSuccess?: boolean;
};

export function InquiryDeleteDialog({
  open,
  onOpenChange,
  inquiryId,
  guestName,
  guestEmail,
  redirectOnSuccess = false,
}: Props) {
  const router = useRouter();
  const deleteMutation = useDeleteInquiry();

  function handleDelete() {
    deleteMutation.mutate(inquiryId, {
      onSuccess: () => {
        toast.success('Inquiry deleted');
        onOpenChange(false);
        if (redirectOnSuccess) {
          router.push('/inquiries');
        }
      },
      onError: (error) => {
        toast.error('Failed to delete inquiry', {
          description: error.message,
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Delete inquiry?</DialogTitle>
          <DialogDescription className="text-center">
            This will permanently remove the inquiry for{' '}
            <span className="font-medium text-manager-text">{guestName}</span>
            {guestEmail ? (
              <>
                {' '}
                (<span className="text-manager-text">{guestEmail}</span>)
              </>
            ) : null}
            . This action cannot be undone and does not affect any Lodgify
            booking.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={deleteMutation.isPending}
            onClick={() => onOpenChange(false)}
            className="flex-1 border-manager-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            className="flex-1"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete inquiry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
