'use client';

import { cn } from '@repo/ui/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { GuestStepper } from './GuestStepper';
import { ExperienceSheetProps } from './types';
import { CalenderPicker } from '../CalenderPicker';
import { SubmitRequestButton } from './SubmitRequestButton';
import { useCreateRequest, isQueuedResult } from '@/hooks/useRequests';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const ONLINE_CONFIRMATION =
  "We'll confirm your request within the hour. You'll be notified.";
const QUEUED_CONFIRMATION =
  "You're offline — we've saved this request and will submit it automatically as soon as you're back online.";

export function RequestExperienceSheet({
  open,
  experience,
  detail,
  preSelectedTimeId,
  onClose,
}: ExperienceSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(
    preSelectedTimeId,
  );
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const maxGuests = detail.maxGuests ?? 8;
  const base = detail.basePrice ?? 0;
  const { isPrimary } = useAuth();
  // Pricing is for the primary member only — secondary guests never see cost.
  const showPrice = isPrimary && base > 0;
  const createRequest = useCreateRequest();

  const handleSubmitRequest = async () => {
    const timeSlot = detail.availableTimes?.find(
      (t) => t.id === selectedTimeId,
    );
    const preferredTime = timeSlot?.time ?? '12:00';
    const preferredDate = selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    const result = await createRequest.mutateAsync({
      catalogItemId: experience.id,
      preferredDate,
      preferredTime,
      guestCount,
      specialRequests: specialRequests || undefined,
    });
    setQueuedOffline(isQueuedResult(result));
  };
  const thumbImage =
    detail.images && detail.images.length > 0
      ? detail.images[0]
      : experience.image;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent
        className={cn(
          'bg-[#FAF8F4] border-0 p-0 flex flex-col',
          'data-[vaul-drawer-direction=right]:w-full',
          'data-[vaul-drawer-direction=right]:rounded-none',
          'data-[vaul-drawer-direction=right]:border-0',
          'data-[vaul-drawer-direction=right]:h-full',
        )}
      >
        <DrawerTitle className="sr-only">
          Request {experience.title}
        </DrawerTitle>

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#E3E0DA] bg-[#FAF8F4] px-5 pb-4 pt-5">
          <DrawerClose asChild>
            <button
              type="button"
              className="shrink-0 text-[#2B2824]"
              aria-label="Go back"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
          </DrawerClose>
          <p className="truncate text-[10px] font-medium uppercase tracking-[2.8px] text-[#2B2824]">
            Request {experience.title}
          </p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 px-5 py-5">
            {/* Experience summary card */}
            <div className="flex items-center gap-3 rounded-xl border border-[#E3E0DA] bg-white px-4 py-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                <Image
                  src={thumbImage}
                  alt={experience.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#2B2824]">
                  {experience.title}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[2px] text-[#797168]">
                  {detail.host ? `${detail.host.name} · ` : ''}
                  {base === 0 ? 'Complimentary' : `$${base.toLocaleString()}`}
                </p>
              </div>
            </div>

            {/* Preferred Date */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Preferred Date
              </p>
              <CalenderPicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </section>

            {detail.availableTimes && detail.availableTimes.length > 0 && (
              <section>
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                  Time Preference
                  {detail.availableDate ? ` — ${detail.availableDate}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {detail.availableTimes.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.disabled}
                      onClick={() =>
                        !slot.disabled && setSelectedTimeId(slot.id)
                      }
                      className={cn(
                        'rounded-full border px-4 py-2 text-[12px] transition-all',
                        selectedTimeId === slot.id
                          ? 'border-[#181818] font-medium text-[#181818]'
                          : 'border-[#E3E0DA] text-[#797168]',
                        slot.disabled && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {slot.label} · {slot.time}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Guest Count */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Guest Count
              </p>
              <GuestStepper
                count={guestCount}
                max={maxGuests}
                onChange={setGuestCount}
              />
            </section>

            {/* Special Requests */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Special Requests
              </p>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Dietary preferences, occasion details..."
                rows={4}
                className="w-full resize-none rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] text-[#2B2824] outline-none placeholder:text-[#B0AAA0] transition-colors focus:border-[#2B2824]"
              />
            </section>

            {/* Price breakdown — primary member only */}
            {showPrice && (
              <section className="rounded-xl border border-[#E3E0DA] bg-white px-4 py-3.5">
                <div className="flex items-center justify-between text-[12px] text-[#797168]">
                  <span>{experience.title}</span>
                  <span className="tabular-nums">
                    ${base.toLocaleString()}.00
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px] text-[#797168]">
                  <span>Service charge (16%)</span>
                  <span className="tabular-nums">
                    ${Math.round(base * 0.16).toLocaleString()}.00
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#E3E0DA] pt-3 text-[14px] font-medium text-[#2B2824]">
                  <span>Total</span>
                  <span className="tabular-nums">
                    ${Math.round(base * 1.16).toLocaleString()}.00
                  </span>
                </div>
              </section>
            )}

            <div className="h-24" />
          </div>
        </div>

        {/* ── Sticky CTA ── */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FAF8F4] from-70% to-transparent px-5 pb-8 pt-8">
          <SubmitRequestButton
            confirmationMessage={
              queuedOffline ? QUEUED_CONFIRMATION : ONLINE_CONFIRMATION
            }
            onSubmit={handleSubmitRequest}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
