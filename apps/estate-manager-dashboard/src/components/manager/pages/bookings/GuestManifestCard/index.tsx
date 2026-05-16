import { Check, FileText } from 'lucide-react';
import { Button } from '@repo/ui';

import type { CurrentBooking } from '@/types';

export const GuestManifestCard = ({ booking }: { booking: CurrentBooking }) => {
  const pct = Math.round((booking.manifestProgress.added / booking.manifestProgress.total) * 100);

  return (
    <div
      id="manifest"
      className="overflow-hidden rounded-xl border border-[#e8e4de] bg-[#fdfdfb] shadow-[0_1px_3px_rgba(26,22,20,0.06)]"
    >
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="font-cormorant text-xl text-manager-text">Guest Manifest</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef9e7] px-3 py-1 text-sm font-medium text-[#9a6a23]">
          <span className="size-2 shrink-0 rounded-full bg-[#e67e22]" />
          Pending Review
        </span>
      </div>

      <div className="space-y-5 px-6 pb-6">
        <div>
          <div className="mb-2.5 flex items-center justify-between text-sm text-manager-text">
            <span>
              {booking.manifestProgress.added} of {booking.manifestProgress.total} guests added
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

        <div className="grid grid-cols-3 gap-3">
          {booking.roomsManifest.map((room) => (
            <div
              key={room.id}
              className="rounded-lg border border-[#dce5dc] bg-[#f4f7f4] px-3.5 py-3"
            >
              <p className="text-sm font-semibold text-manager-text">{room.label}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#4a7c59]">
                <Check className="size-3.5 shrink-0 stroke-[2.5]" />
                {room.guestCount} guest{room.guestCount !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="h-11 flex-[1] gap-2 rounded-lg border-0 bg-[#e8f1e9] text-sm font-medium text-[#4a7c59] shadow-none hover:bg-[#dce8de]">
            <FileText className="size-4 shrink-0" strokeWidth={2} />
            Review Manifest
          </Button>
          <Button
            variant="outline"
            className="h-11 shrink-0 rounded-lg border-[#d4d0c8] bg-white px-5 text-sm font-medium text-manager-text shadow-none hover:bg-[#faf9f7]"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};
