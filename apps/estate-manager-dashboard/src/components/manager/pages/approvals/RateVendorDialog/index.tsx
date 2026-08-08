'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

import { useAddVendorRating } from '@/hooks/useVendors';

const WORDS = [
  '',
  'Wouldn’t use again',
  'Below what we promise',
  'Fine',
  'Good — would book again',
  'Exceptional',
];

/**
 * How the vendor did.
 *
 * The endpoint and the hook have existed since vendors did, and no screen ever
 * called either — so `averageRating` and `totalBookings` sat frozen at zero and
 * Reports ranked "top vendors" on columns nothing wrote to. One tap after an
 * experience finishes is the whole ask; the note is where the useful part
 * actually lives.
 */
export const RateVendorDialog = ({
  request,
  onOpenChange,
}: {
  request: { id: string; vendorName: string; experience: string } | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const rate = useAddVendorRating();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!request) return;
    setRating(0);
    setHovered(0);
    setNotes('');
  }, [request?.id]);

  if (!request) return null;

  const shown = hovered || rating;

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did {request.vendorName} do?</DialogTitle>
          <DialogDescription>
            {request.experience} — just finished. This is what the vendor list
            and the reports are ranked on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onMouseEnter={() => setHovered(n)}
                onClick={() => setRating(n)}
                className="rounded p-0.5"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    n <= shown
                      ? 'fill-[#c8a96e] text-[#c8a96e]'
                      : 'text-manager-border',
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-xs text-manager-text-muted">
              {WORDS[shown] ?? ''}
            </span>
          </div>

          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering next time — late, brought extra staff, the guests loved them."
            className="text-xs"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-manager-border bg-white text-manager-text"
          >
            Not now
          </Button>
          <Button
            type="button"
            disabled={rating === 0 || rate.isPending}
            onClick={() =>
              rate.mutate(
                {
                  experienceRequestId: request.id,
                  rating,
                  notes: notes.trim() || undefined,
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
            className="bg-manager-accent text-white hover:opacity-90"
          >
            {rate.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
