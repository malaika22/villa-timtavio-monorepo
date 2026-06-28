'use client';

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

import { useDeleteCatalogItem } from '@/hooks/useCatalogAdmin';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string | null;
  experienceName: string;
};

export function ExperienceDeleteDialog({
  open,
  onOpenChange,
  experienceId,
  experienceName,
}: Props) {
  const deleteMutation = useDeleteCatalogItem();

  function handleDelete() {
    if (!experienceId) return;
    deleteMutation.mutate(experienceId, {
      onSuccess: () => {
        toast.success('Experience deleted');
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error('Failed to delete experience', {
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
          <DialogTitle className="text-center">Delete experience?</DialogTitle>
          <DialogDescription className="text-center">
            This will remove{' '}
            <span className="font-medium text-manager-text">
              {experienceName}
            </span>{' '}
            from the guest catalog. This action cannot be undone.
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
            {deleteMutation.isPending ? 'Deleting…' : 'Delete experience'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
