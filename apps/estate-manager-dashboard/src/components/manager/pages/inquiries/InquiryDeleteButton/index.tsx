'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@repo/ui';
import { toast } from 'sonner';

import { InquiryDeleteDialog } from '@/components/manager/pages/inquiries/InquiryDeleteDialog';
import type { InquiryStatus } from '@repo/api-types';

type Props = {
  inquiryId: string;
  guestName: string;
  guestEmail?: string;
  status: InquiryStatus;
  variant?: 'detail' | 'list';
  redirectOnSuccess?: boolean;
};

export function InquiryDeleteButton({
  inquiryId,
  guestName,
  guestEmail,
  status,
  variant = 'detail',
  redirectOnSuccess = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const isConverted = status === 'CONVERTED';

  function openDeleteModal() {
    if (isConverted) {
      toast.error('Cannot delete a converted inquiry');
      return;
    }
    setOpen(true);
  }

  if (variant === 'list') {
    return (
      <>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isConverted}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openDeleteModal();
          }}
          className="size-9 p-0 text-manager-text-muted hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete inquiry for ${guestName}`}
        >
          <Trash2 className="size-4" />
        </Button>
        <InquiryDeleteDialog
          open={open}
          onOpenChange={setOpen}
          inquiryId={inquiryId}
          guestName={guestName}
          guestEmail={guestEmail}
          redirectOnSuccess={false}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-manager-border bg-manager-card p-6">
        <h2 className="text-sm font-semibold text-manager-text">
          Delete inquiry
        </h2>
        <p className="mt-1 text-sm text-manager-text-muted">
          {isConverted
            ? 'Converted inquiries are linked to a booking and cannot be deleted.'
            : 'Permanently remove this inquiry from the dashboard. This does not affect any Lodgify booking.'}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isConverted}
          onClick={openDeleteModal}
          className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="mr-2 size-4" />
          Delete inquiry
        </Button>
      </div>

      <InquiryDeleteDialog
        open={open}
        onOpenChange={setOpen}
        inquiryId={inquiryId}
        guestName={guestName}
        guestEmail={guestEmail}
        redirectOnSuccess={redirectOnSuccess}
      />
    </>
  );
}
