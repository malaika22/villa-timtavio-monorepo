'use client';

import { useState } from 'react';
import { CalendarX } from 'lucide-react';
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
import type { BrokerHold } from '@repo/api-types';

import { stayDateWithYear } from '@/lib/stay-date';
import { useReleaseHold } from '@/hooks/useBrokerHolds';

/**
 * Taking a hold back.
 *
 * Behind a dialog rather than a bare button because releasing a *confirmed*
 * hold undoes a promise the estate already made. The reason field is what
 * makes the row still worth having afterwards: "released" on its own tells
 * nobody whether the broker's client cancelled or Rodrigo was tidying up a
 * test.
 */
export function BrokerHoldReleaseDialog({
  open,
  onOpenChange,
  hold,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hold: BrokerHold;
}) {
  const release = useReleaseHold();
  const [reason, setReason] = useState('');

  // No effect resets this. The page mounts the dialog only while a hold is
  // being released and keys it by that hold, so a reason typed and abandoned
  // on one card cannot reappear on another — which is the one thing worse
  // here than no reason at all.
  const confirmed = hold.status === 'CONFIRMED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-[#fdf4e3]">
            <CalendarX className="size-6 text-[#8a6d3b]" />
          </div>
          <DialogTitle className="text-center">
            {confirmed
              ? 'Release these confirmed dates?'
              : 'Release this hold?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium text-manager-text">
              {stayDateWithYear(hold.checkIn)} →{' '}
              {stayDateWithYear(hold.checkOut)}
            </span>{' '}
            goes back on sale, and{' '}
            <span className="text-manager-text">{hold.brokerName}</span>
            {hold.brokerEmail
              ? ' is emailed to say so'
              : ' has no email on record to notify'}
            .
            {confirmed
              ? ' The estate had accepted this hold, so the record stays — it just stops holding the nights.'
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div>
          <label
            htmlFor="release-reason"
            className="block text-xs font-medium text-manager-text-muted"
          >
            Why? (optional)
          </label>
          <Textarea
            id="release-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Broker's client cancelled"
            rows={2}
            className="mt-1.5 border-manager-border"
          />
          {/* Said plainly because the opposite assumption is the dangerous
              one: a manager who thinks this reaches the broker will write it
              for the broker. It is kept on the record, and nowhere else. */}
          <p className="mt-1.5 text-xs text-manager-text-muted">
            Kept on the hold for the estate. Not sent to the broker.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={release.isPending}
            onClick={() => onOpenChange(false)}
            className="flex-1 border-manager-border"
          >
            Keep it
          </Button>
          <Button
            type="button"
            disabled={release.isPending}
            onClick={() =>
              release.mutate(
                { id: hold.id, note: reason.trim() || undefined },
                { onSuccess: () => onOpenChange(false) },
              )
            }
            className="flex-1 bg-[#8a6d3b] text-white hover:opacity-90"
          >
            {release.isPending ? 'Releasing…' : 'Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
