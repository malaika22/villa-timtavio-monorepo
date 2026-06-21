'use client';

import { useState } from 'react';
import { Check, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@repo/ui';

import type { ManifestResponse } from '@repo/api-types';
import { useApproveManifest, useChefsBrief } from '@/hooks/useManifest';
import { STATUS_LABELS } from './constants';
import { ManifestDetailSheet } from './ManifestDetailSheet';

export const GuestManifestCard = ({
  bookingId,
  manifest,
}: {
  bookingId: string;
  manifest: ManifestResponse | null | undefined;
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const approveManifest = useApproveManifest();
  const { data: chefsBrief } = useChefsBrief(
    manifest?.manifestStatus === 'APPROVED' ? bookingId : null,
  );

  const pct = manifest
    ? Math.min(
        100,
        Math.round(
          (manifest.addedGuests / Math.max(manifest.totalGuests, 1)) * 100,
        ),
      )
    : 0;
  const statusInfo = STATUS_LABELS[manifest?.manifestStatus ?? 'INCOMPLETE'];

  const handleApprove = () => {
    approveManifest.mutate(bookingId);
  };

  const canReview = (manifest?.guests?.length ?? 0) > 0;

  return (
    <div
      id="manifest"
      className="overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fdfdfb] shadow-[0_1px_3px_rgba(26,22,20,0.06)]"
    >
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="font-cormorant text-xl text-manager-text">
          Guest Manifest
        </h3>
        {statusInfo && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
            style={{ background: statusInfo.bg, color: statusInfo.text }}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: statusInfo.dot }}
            />
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className="space-y-5 px-6 pb-6">
        <div>
          <div className="mb-2.5 flex items-center justify-between text-sm text-manager-text">
            <span>
              {manifest?.addedGuests ?? 0} of {manifest?.totalGuests ?? 0}{' '}
              guests added
            </span>
            <span className="font-medium text-[#4a7c59]">{pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#e8ebe8]">
            <div
              className="h-full rounded-full bg-[#4a7c59] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {manifest?.roomSummary && manifest.roomSummary.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {manifest.roomSummary.map((room) => (
              <div
                key={room.roomNumber}
                className="rounded-lg border border-[#dce5dc] bg-[#f4f7f4] px-3.5 py-3"
              >
                <p className="text-sm font-semibold text-manager-text">
                  {room.roomName}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#4a7c59]">
                  <Check className="size-3.5 shrink-0 stroke-[2.5]" />
                  {room.assignedGuests} guest
                  {room.assignedGuests !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {manifest?.manifestStatus === 'SUBMITTED' ? (
            <Button
              className="h-11 flex-[1] gap-2 rounded-lg border-0 bg-[#4a7c59] text-sm font-medium text-white shadow-none hover:bg-[#3a6448]"
              onClick={handleApprove}
              disabled={approveManifest.isPending}
            >
              <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
              {approveManifest.isPending ? 'Approving…' : 'Approve Manifest'}
            </Button>
          ) : (
            <Button
              className="h-11 flex-[1] gap-2 rounded-lg border-0 bg-[#e8f1e9] text-sm font-medium text-[#4a7c59] shadow-none hover:bg-[#dce8de] disabled:opacity-50"
              onClick={() => setShowDetail(true)}
              disabled={!canReview}
            >
              <FileText className="size-4 shrink-0" strokeWidth={2} />
              Review Manifest
            </Button>
          )}
          {chefsBrief && (
            <Button
              variant="outline"
              className="h-11 shrink-0 rounded-lg border-[#d4d0c8] bg-white px-5 text-sm font-medium text-manager-text shadow-none hover:bg-[#faf9f7]"
              onClick={() => {
                const blob = new Blob([JSON.stringify(chefsBrief, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chefs-brief-${bookingId}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Chef&apos;s Brief
            </Button>
          )}
        </div>
      </div>

      {manifest && (
        <ManifestDetailSheet
          open={showDetail}
          onClose={() => setShowDetail(false)}
          bookingId={bookingId}
          manifest={manifest}
        />
      )}
    </div>
  );
};
