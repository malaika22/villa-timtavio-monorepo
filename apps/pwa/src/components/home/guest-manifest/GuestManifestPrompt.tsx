'use client';

import { GuestManifestForm } from '@/components/GuestManifestForm';
import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MAX_GUESTS = 16;

type GuestManifestPromptProps = {
  guestsAdded?: number;
};

export const GuestManifestPrompt = ({
  guestsAdded = 2,
}: GuestManifestPromptProps) => {
  const pct = Math.min(100, Math.round((guestsAdded / MAX_GUESTS) * 100));
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAddGuest = () => {
    setIsOpen(true);
  };

  const handleSave = () => {
    router.push('/guest-submitted');
  };

  return (
    <>
      <article className="overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
        <div className="space-y-4 px-[14px] py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-cormorant text-[20px] font-medium italic leading-tight text-[#2B2824]">
              Guest manifest
            </h2>
            <div
              className="shrink-0 rounded-full border border-[#854F0B]/35 bg-[#FAEEDA] px-[10px] py-1 text-[10px] font-medium uppercase tracking-[1.12px] text-[#854F0B]"
              role="status"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-[5px] shrink-0 rounded-full bg-[#BA7517]"
                  aria-hidden
                />
                Action needed
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-[1.45] text-[#797168]">
            Assign your guests to rooms and share dietary preferences before
            arrival.
          </p>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 text-[8px] uppercase tracking-[3.08px] text-[#797168]">
              <span>Guests added</span>
              <span className="font-medium tabular-nums text-[#2B2824]">
                {guestsAdded}
                <span className="text-[#797168]"> / {MAX_GUESTS}</span>
              </span>
            </div>
            <Progress value={pct} className="h-1.5 rounded-full bg-[#E3E0DA]" />
          </div>

          <div className="space-y-2 border-t border-[#E3E0DA] pt-4 flex items-center justify-between">
            <p className="text-[8px] uppercase mb-0 tracking-[3.08px] text-[#797168]">
              Rooms available : 2
            </p>
            <Link
              href="#"
              className="text-[8px] uppercase tracking-[3.08px] text-[#797168] flex items-center gap-2"
            >
              View Manifest
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            </Link>
          </div>

          <Button
            onClick={handleAddGuest}
            type="button"
            className="h-10 w-full gap-2 rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[12px] font-medium text-white hover:bg-[#1A3040] hover:text-white"
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            Add guest
          </Button>
        </div>
      </article>
      {isOpen && (
        <GuestManifestForm
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
          onSave={handleSave}
          onRemoveGuest={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
