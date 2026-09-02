'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Drawer, DrawerContent } from '@repo/ui/components/drawer';
import { AutoGrowTextarea } from '../AutoGrowTextarea';
import { cn } from '@repo/ui/lib/utils';
import { dietaryLabel } from '@repo/api-types';
import type { ManifestGuest } from '@repo/api-types';

import { useUpdateManifestGuest } from '@/hooks/useManifest';
import { useManifestOptions } from '@/hooks/useManifestOptions';

/**
 * A guest correcting their own record.
 *
 * Until now the primary member was the only person who could touch any of
 * this, so a guest with a shellfish allergy had to text whoever booked the
 * villa and have it typed in for them. This is the same data the kitchen run
 * sheet quotes at every service, and the person it belongs to is the one most
 * likely to get it right.
 *
 * Rooms and the guest list are absent on purpose — they belong to the party,
 * not to any one guest. Email is absent because it is what their sign-in is
 * scoped to.
 */
export function YourDetailsSheet({
  open,
  onClose,
  guest,
}: {
  open: boolean;
  onClose: () => void;
  guest: ManifestGuest;
}) {
  const update = useUpdateManifestGuest();
  const { data: options } = useManifestOptions(open);

  const [allergies, setAllergies] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [dietaryOther, setDietaryOther] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Reseeded on each opening, so a half-typed change that was abandoned last
  // time doesn't come back looking like it was saved.
  useEffect(() => {
    if (!open) return;
    setAllergies(guest.allergies ?? '');
    setDietary(guest.dietaryRestrictions ?? []);
    setDietaryOther(guest.dietaryOtherDetails ?? '');
    setPhone(guest.phone ?? '');
    setNotes(guest.specialNotes ?? '');
  }, [open, guest]);

  const toggle = (value: string) =>
    setDietary((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );

  const save = () =>
    update.mutate(
      {
        guestId: guest.id,
        dto: {
          allergies: allergies.trim(),
          dietaryRestrictions: dietary,
          dietaryOtherDetails: dietaryOther.trim() || undefined,
          phone: phone.trim() || undefined,
          specialNotes: notes.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    );

  return (
    <Drawer open={open} onOpenChange={onClose}>
      {/* DrawerContent is a flex column with a max height, so putting the
          scroll on it directly made every child a shrinkable flex item: the
          fields compressed instead of scrolling, the email block was cut off
          mid-sentence, and Save was nowhere. The scroll belongs to an inner
          region that is allowed to be taller than the box — the same shape
          RoomDetailSheet already uses. */}
      <DrawerContent className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[20px] bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-7">
          <p className="text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
            Your details
          </p>
          <h2 className="mt-1.5 font-cormorant text-[24px] leading-tight text-[#2B2824]">
            {guest.firstName} {guest.lastName}
          </h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#797168]">
            The estate keeps this for the kitchen and your room. Change it
            whenever you like — the chef sees the latest version.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="own-allergies"
                className="block text-[9px] uppercase tracking-[2px] text-[#B4322B]"
              >
                Allergies
              </label>
              <AutoGrowTextarea
                id="own-allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Severe shellfish allergy — carries an EpiPen"
                className="mt-2 w-full border-0 border-b border-[#E3E0DA] bg-transparent px-0 py-2 text-[14px] leading-relaxed text-[#2B2824] placeholder:text-[#B5AEA4] focus:border-[#B4322B] focus:outline-none"
              />
              <p className="mt-2 text-[10.5px] leading-relaxed text-[#797168]">
                The chef reads this before every service.
              </p>
            </div>

            <div>
              <span className="block text-[9px] uppercase tracking-[2px] text-[#9A9288]">
                Dietary
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {(options?.dietaryRestrictions ?? []).map((option) => {
                  const on = dietary.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      aria-pressed={on}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-[12px] transition-colors',
                        on
                          ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white'
                          : 'border-[#E3E0DA] text-[#797168]',
                      )}
                    >
                      {option.label || dietaryLabel(option.value)}
                    </button>
                  );
                })}
              </div>
              {dietary.includes('other') && (
                <input
                  value={dietaryOther}
                  onChange={(e) => setDietaryOther(e.target.value)}
                  placeholder="Tell the kitchen more"
                  className="mt-3 w-full border-0 border-b border-[#E3E0DA] bg-transparent px-0 py-2 text-[14px] text-[#2B2824] placeholder:text-[#B5AEA4] focus:border-[#B08D57] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="own-phone"
                className="block text-[9px] uppercase tracking-[2px] text-[#9A9288]"
              >
                Phone
              </label>
              <input
                id="own-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full border-0 border-b border-[#E3E0DA] bg-transparent px-0 py-2 text-[14px] text-[#2B2824] focus:border-[#B08D57] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="own-notes"
                className="block text-[9px] uppercase tracking-[2px] text-[#9A9288]"
              >
                Anything else
              </label>
              <AutoGrowTextarea
                id="own-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Early riser — coffee from 7"
                className="mt-2 w-full border-0 border-b border-[#E3E0DA] bg-transparent px-0 py-2 text-[14px] leading-relaxed text-[#2B2824] placeholder:text-[#B5AEA4] focus:border-[#B08D57] focus:outline-none"
              />
            </div>

            {/* Shown rather than hidden: a guest who can't find their email
              assumes the app has lost it. Saying why it's fixed, and who can
              change it, answers the question before it becomes a message. */}
            <div className="rounded-[12px] bg-[#F5F3EF] px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[2px] text-[#9A9288]">
                <Lock className="size-3" aria-hidden />
                Email
              </p>
              <p className="mt-1.5 text-[13px] text-[#2B2824]">{guest.email}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#797168]">
                This is how you sign in. Ask your concierge if it needs
                changing.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={save}
            disabled={update.isPending}
            className="mt-7 h-12 w-full rounded-[10px] bg-[#0F1F2E] text-[10px] uppercase tracking-[2px] text-white"
          >
            {update.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            )}
            Save
          </Button>

          {update.isError && (
            <p className="mt-3 text-center text-[11px] text-[#B4322B]">
              {(update.error as Error).message}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
