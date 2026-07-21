'use client';

import { cn } from '@repo/ui/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { ArrowLeft, Clock, Check, Users } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { GuestStepper } from './GuestStepper';
import { ExperienceSheetProps } from './types';
import { CalenderPicker } from '../CalenderPicker';
import { SubmitRequestButton } from './SubmitRequestButton';
import { TimePicker, buildGroups, firstRecommended } from '../TimePicker';
import { useCreateRequest, isQueuedResult } from '@/hooks/useRequests';
import { format } from 'date-fns';

const ONLINE_CONFIRMATION =
  "We'll confirm your request within the hour. You'll be notified.";
const QUEUED_CONFIRMATION =
  "You're offline — we've saved this request and will submit it automatically as soon as you're back online.";

// ─── Sheet ──────────────────────────────────────────────────────────────────

export function RequestExperienceSheet({
  open,
  experience,
  detail,
  preSelectedTimeId,
  onClose,
}: ExperienceSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const timeGroups = useMemo(
    () => buildGroups(detail.availableTimes),
    [detail.availableTimes],
  );

  // Estate recommends a default: the pre-selected slot, else the first enabled
  // recommendation — the guest can always change it (chip or custom entry).
  const defaultTime = useMemo(() => {
    if (preSelectedTimeId) {
      const s = detail.availableTimes?.find((t) => t.id === preSelectedTimeId);
      if (s) return s.time;
    }
    return firstRecommended(timeGroups) ?? '19:00';
  }, [detail.availableTimes, preSelectedTimeId, timeGroups]);

  const [time, setTime] = useState(defaultTime);

  const createRequest = useCreateRequest();

  const handleSubmitRequest = async () => {
    const preferredDate = selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    const result = await createRequest.mutateAsync({
      catalogItemId: experience.id,
      preferredDate,
      preferredTime: time || '12:00',
      guestCount,
      specialRequests: specialRequests || undefined,
    });
    setQueuedOffline(isQueuedResult(result));
  };

  const images =
    detail.images && detail.images.length > 0
      ? detail.images
      : [experience.image];
  const [activeImg, setActiveImg] = useState(0);

  const durationLabel = experience.durationMinutes
    ? `${experience.durationMinutes} min`
    : experience.experienceHours
      ? `${experience.experienceHours} ${experience.experienceHours === 1 ? 'hour' : 'hours'}`
      : null;
  const capacityLabel = detail.maxGuests
    ? `Up to ${detail.maxGuests} guests`
    : null;
  const maxGuests = detail.maxGuests ?? 8;

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

        {/* ── Scrollable body (hero sits under a floating back button) ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Hero + gallery */}
          <div className="relative h-[268px]">
            <div
              className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) =>
                setActiveImg(
                  Math.round(
                    e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
                  ),
                )
              }
            >
              {images.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative h-full min-w-full snap-center bg-neutral-200"
                >
                  <Image
                    src={src}
                    alt={experience.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>

            {/* Overlays (non-interactive so the gallery stays swipeable) */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141210]/88 via-[#141210]/25 to-[#141210]/10" />

            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Go back"
                className="absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/92 text-[#2B2824] shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
              >
                <ArrowLeft className="size-5" strokeWidth={2} />
              </button>
            </DrawerClose>

            <span className="pointer-events-none absolute left-4 top-[68px] rounded-full bg-[#FAF8F4]/92 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[2px] text-[#0F1F2E]">
              {experience.category}
            </span>

            {images.length > 1 && (
              <div className="pointer-events-none absolute left-1/2 top-[236px] flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full bg-white/50 transition-all',
                      i === activeImg ? 'w-4 bg-white' : 'w-1.5',
                    )}
                  />
                ))}
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-4">
              <h1 className="font-cormorant text-[26px] font-medium leading-[1.1] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
                {experience.title}
              </h1>
              {(durationLabel || capacityLabel) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {durationLabel && (
                    <span className="flex items-center gap-1.5 text-[11px] text-white/90">
                      <Clock className="size-3.5" strokeWidth={1.75} />
                      {durationLabel}
                    </span>
                  )}
                  {capacityLabel && (
                    <span className="flex items-center gap-1.5 text-[11px] text-white/90">
                      <Users className="size-3.5" strokeWidth={1.75} />
                      {capacityLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 px-5 py-6">
            {/* About */}
            {detail.about && (
              <section>
                <p className="text-[14px] font-medium leading-relaxed text-[#2B2824]">
                  {detail.about}
                </p>
                {detail.longDescription && (
                  <p className="mt-2 text-[13px] leading-relaxed text-[#797168]">
                    {detail.longDescription}
                  </p>
                )}
              </section>
            )}

            {/* What's included */}
            {detail.included && detail.included.length > 0 && (
              <section>
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                  What's included
                </p>
                <div className="flex flex-wrap gap-2">
                  {detail.included.map((inc) => (
                    <span
                      key={inc}
                      className="flex items-center gap-1.5 rounded-full border border-[#E3E0DA] bg-white px-3 py-1.5 text-[12px] text-[#453F38]"
                    >
                      <Check className="size-3.5 text-[#4A7C59]" strokeWidth={2.5} />
                      {inc}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Host */}
            {detail.host && (
              <section>
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                  Your host
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-[#E3E0DA] bg-white px-4 py-3.5">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <Image
                      src={detail.host.avatar}
                      alt={detail.host.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#2B2824]">
                      {detail.host.name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[1.4px] text-[#797168]">
                      {detail.host.role}
                      {detail.host.category ? ` · ${detail.host.category}` : ''}
                    </p>
                    {detail.host.reviewNote && (
                      <p className="mt-1 text-[11.5px] italic leading-snug text-[#8A8178]">
                        “{detail.host.reviewNote}”
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Preferred Date — full calendar, any future date */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Preferred date
              </p>
              <CalenderPicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </section>

            {/* Preferred Time — recommended slots + custom fallback */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Preferred time
                {detail.availableDate ? ` — ${detail.availableDate}` : ''}
              </p>
              <TimePicker value={time} groups={timeGroups} onChange={setTime} />
            </section>

            {/* Guest Count */}
            <section>
              <p className="mb-3 text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                Guest count
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
                Special requests
              </p>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Dietary preferences, occasion details..."
                rows={4}
                className="w-full resize-none rounded-xl border border-[#E3E0DA] bg-white px-4 py-3 text-[13px] text-[#2B2824] outline-none placeholder:text-[#B0AAA0] transition-colors focus:border-[#2B2824]"
              />
            </section>

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
            onDismiss={onClose}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
