'use client';

import type { Experience } from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import {
  DEFAULT_EXPERIENCE_DETAIL,
  EXPERIENCE_DETAIL_DATA,
} from '@/data/experiencesMockData';
import { cn } from '@repo/ui/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Lock } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ExperienceBadge } from '@/components/featured-experiences/ExperienceBadge';
import { RequestExperienceSheet } from '@/components/RequestExperienceSheet';
import { Button } from '@repo/ui';

interface Props {
  /** Always non-null — parent controls rendering with AnimatePresence */
  experience: Experience;
  onClose: () => void;
}

const CLOSE_DRAG_THRESHOLD = 140;
const CLOSE_VELOCITY_THRESHOLD = 850;

const imageSlideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%' }),
};

export function ExperienceDetailSheet({ experience, onClose }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Lock body scroll while the sheet (or its child form) is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const detail =
    EXPERIENCE_DETAIL_DATA[experience.id] ?? DEFAULT_EXPERIENCE_DETAIL;
  const images =
    detail.images && detail.images.length > 0
      ? detail.images
      : [experience.image];

  const isLocked = experience.status === ExperienceStatus.LOCKED_PRE_ARRIVAL;
  const isAvailable = experience.status === ExperienceStatus.AVAILABLE;
  const isCompleted = experience.status === ExperienceStatus.COMPLETED;

  const showTimePicker =
    (isAvailable || isCompleted) &&
    detail.availableTimes &&
    detail.availableTimes.length > 0;
  const showRequestCTA = isAvailable || isCompleted;

  const goToImage = (newIdx: number) => {
    setDirection(newIdx > activeImage ? 1 : -1);
    setActiveImage(newIdx);
  };

  const durationLabel = experience.durationMinutes
    ? `${experience.durationMinutes} Min`
    : experience.experienceHours
      ? `${experience.experienceHours} ${experience.experienceHours === 1 ? 'Hour' : 'Hours'}`
      : null;

  return (
    <>
      {/* Backdrop — fades with the sheet */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col overflow-hidden rounded-t-[22px] bg-[#FAF8F4]"
        style={{ height: '92dvh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 1 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (
            info.offset.y > CLOSE_DRAG_THRESHOLD ||
            info.velocity.y > CLOSE_VELOCITY_THRESHOLD
          ) {
            onClose();
          }
        }}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="relative h-[260px] overflow-hidden bg-neutral-200">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeImage}
                custom={direction}
                variants={imageSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 0.85,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 && activeImage < images.length - 1) {
                    goToImage(activeImage + 1);
                  } else if (info.offset.x > 60 && activeImage > 0) {
                    goToImage(activeImage - 1);
                  }
                }}
                className="absolute inset-0"
              >
                <Image
                  src={images[activeImage]}
                  alt={experience.title}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <Button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={cn(
                      'rounded-full bg-white transition-all duration-300',
                      i === activeImage
                        ? 'h-1.5 w-4 opacity-100'
                        : 'h-1.5 w-1.5 opacity-50',
                    )}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="px-5 pt-5">
            {/* Category + Price row */}
            <div className="flex items-start justify-between gap-4">
              <ExperienceBadge
                experienceName={experience.category.toUpperCase()}
              />
            </div>

            <h1 className="font-cormorant mt-3 text-[32px] font-medium leading-[1.05] text-[#2B2824]">
              {experience.title}
            </h1>

            {(durationLabel || detail.maxGuests) && (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[2.5px] text-[#797168]">
                {[
                  durationLabel,
                  detail.maxGuests ? `Up to ${detail.maxGuests} guests` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            <hr className="my-5 border-[#E3E0DA]" />

            <section>
              <p className="text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                About
              </p>
              <p className="mt-2 text-[15px] font-medium leading-[1.45] text-[#2B2824]">
                {detail.about}
              </p>
              {detail.longDescription && (
                <p className="mt-2 text-[13px] leading-[1.6] text-[#797168]">
                  {detail.longDescription}
                </p>
              )}
            </section>

            {detail.included.length > 0 && (
              <section className="mt-5">
                <p className="text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                  What&apos;s Included
                </p>
                <ul className="mt-2 space-y-2">
                  {detail.included.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] text-[#2B2824]"
                    >
                      <span className="mt-[5px] size-1.5 shrink-0 rounded-full bg-[#797168]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.host && (
              <>
                <hr className="my-5 border-[#E3E0DA]" />
                <section>
                  <p className="text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                    Your Host
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                      <Image
                        src={detail.host.avatar}
                        alt={detail.host.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#2B2824]">
                        {detail.host.name}
                      </p>
                      <p className="text-[9px] uppercase tracking-[2px] text-[#797168]">
                        {detail.host.role} · {detail.host.category}
                      </p>
                    </div>
                  </div>
                  {detail.host.reviewNote && (
                    <div className="mt-3 rounded-xl border border-[#E3E0DA] bg-white px-4 py-3">
                      <p className="text-[12px] italic leading-[1.5] text-[#797168]">
                        {detail.host.reviewNote}
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}

            {showTimePicker && detail.availableTimes && (
              <>
                <hr className="my-5 border-[#E3E0DA]" />
                <section>
                  <p className="text-[9px] font-medium uppercase tracking-[2.8px] text-[#B0AAA0]">
                    Available Times
                    {detail.availableDate ? ` — ${detail.availableDate}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.availableTimes.map((slot) => (
                      <Button
                        key={slot.id}
                        type="button"
                        disabled={slot.disabled}
                        onClick={() =>
                          !slot.disabled && setSelectedTimeId(slot.id)
                        }
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] transition-all',
                          selectedTimeId === slot.id
                            ? 'border-[#181818] font-medium text-[#181818]'
                            : 'border-[#E3E0DA] text-[#797168]',
                          slot.disabled && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {slot.label} · {slot.time}
                        {slot.disabled && (
                          <Info className="size-3" aria-hidden />
                        )}
                      </Button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Locked notice */}
            {isLocked && (
              <>
                <hr className="my-5 border-[#E3E0DA]" />
                <div className="flex items-start gap-3 rounded-xl border border-[#E3E0DA] bg-[#F5F3F0] px-4 py-4">
                  <Lock className="mt-0.5 size-4 shrink-0 text-[#797168]" />
                  <p className="text-[12px] leading-[1.5] text-[#797168]">
                    This experience will be available once you check in to the
                    villa.
                  </p>
                </div>
              </>
            )}

            {/* Bottom spacer for sticky CTA */}
            <div className="h-28" />
          </div>
        </div>

        {/* ── Sticky CTA ── */}
        {(showRequestCTA || isLocked) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FAF8F4] from-70% to-transparent px-5 pb-8 pt-8">
            {showRequestCTA && (
              <Button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="w-full rounded-xl bg-[#181818] py-4 text-[11px] font-medium uppercase tracking-[2px] text-white transition-colors active:bg-[#333]"
              >
                {isCompleted ? 'Request Again' : 'Request Experience'}
              </Button>
            )}
            {isLocked && (
              <Button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl bg-[#E3E0DA] py-4 text-[11px] font-medium uppercase tracking-[2px] text-[#B0AAA0]"
              >
                Available After Check-In
              </Button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showRequestForm && (
          <RequestExperienceSheet
            experience={experience}
            detail={detail}
            preSelectedTimeId={selectedTimeId}
            onClose={() => setShowRequestForm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
