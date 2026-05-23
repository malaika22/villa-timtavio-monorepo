'use client';

import { cn } from '@repo/ui/lib/utils';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { GuestStepper } from './GuestStepper';
import { ExperienceSheetProps } from './types';
import { CalenderPicker } from '../CalenderPicker';
import { SubmitRequestButton } from './SubmitRequestButton';

export function RequestExperienceSheet({
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

  const maxGuests = detail.maxGuests ?? 8;
  const base = detail.basePrice ?? 0;

  const thumbImage =
    detail.images && detail.images.length > 0
      ? detail.images[0]
      : experience.image;

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-w-md flex-col bg-[#FAF8F4]"
      style={{ height: '100dvh' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 1 }}
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#E3E0DA] bg-[#FAF8F4] px-5 pb-4 pt-14">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[#2B2824]"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </button>
        <p className="truncate text-[10px] font-medium uppercase tracking-[2.8px] text-[#2B2824]">
          Request {experience.title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-6 px-5 py-5">
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
                    onClick={() => !slot.disabled && setSelectedTimeId(slot.id)}
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

          <div className="h-24" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FAF8F4] from-70% to-transparent px-5 pb-8 pt-8">
        <SubmitRequestButton confirmationMessage="We'll confirm your request within the hour. You'll be notified." />
      </div>
    </motion.div>
  );
}
