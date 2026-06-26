'use client';

import type { Experience } from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import { DEFAULT_EXPERIENCE_DETAIL } from '@/data/experiencesMockData';
import { useCatalog } from '@/hooks/useCatalog';
import { mapCatalogItemToDetail } from '@/lib/mappers/experience';
import { cn } from '@repo/ui/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Lock } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ExperienceBadge } from '@/components/featured-experiences/ExperienceBadge';
import { RequestExperienceSheet } from '@/components/RequestExperienceSheet';
import { Button } from '@repo/ui/components/button';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';

interface Props {
  open: boolean;
  experience: Experience | null;
  onClose: () => void;
}

const imageSlideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%' }),
};

interface SheetState {
  exp: Experience;
  activeImage: number;
  direction: number;
  selectedTimeId: string | null;
  showRequestForm: boolean;
}

export function ExperienceDetailSheet({ open, experience, onClose }: Props) {
  const [sheet, setSheet] = useState<SheetState | null>(null);

  // React-documented "storing information from previous renders" pattern.
  // Snapshots the experience + resets carousel/form state atomically when a new
  // experience arrives. When experience becomes null (drawer closing), the last
  // snapshot stays in state so the close animation shows content instead of blank.
  if (experience !== null && experience !== sheet?.exp) {
    setSheet({
      exp: experience,
      activeImage: 0,
      direction: 0,
      selectedTimeId: null,
      showRequestForm: false,
    });
  }

  const { data: catalogItems } = useCatalog();

  const exp = sheet?.exp ?? null;
  // Detail comes from the EM-managed catalog item; fall back to a generic
  // default only if the item isn't loaded yet.
  const catalogItem = exp
    ? catalogItems?.find((item) => item.id === exp.id)
    : undefined;
  const detail = catalogItem
    ? mapCatalogItemToDetail(catalogItem)
    : DEFAULT_EXPERIENCE_DETAIL;
  const images = exp
    ? detail.images && detail.images.length > 0
      ? detail.images
      : [exp.image]
    : [];

  const isLocked = exp?.status === ExperienceStatus.LOCKED_PRE_ARRIVAL;
  const isAvailable = exp?.status === ExperienceStatus.AVAILABLE;
  const isCompleted = exp?.status === ExperienceStatus.COMPLETED;
  const showTimePicker =
    (isAvailable || isCompleted) &&
    detail.availableTimes &&
    detail.availableTimes.length > 0;
  const showRequestCTA = isAvailable || isCompleted;

  const durationLabel = exp?.durationMinutes
    ? `${exp.durationMinutes} Min`
    : exp?.experienceHours
      ? `${exp.experienceHours} ${exp.experienceHours === 1 ? 'Hour' : 'Hours'}`
      : null;

  const goToImage = (newIdx: number) => {
    setSheet((prev) =>
      prev
        ? {
            ...prev,
            activeImage: newIdx,
            direction: newIdx > prev.activeImage ? 1 : -1,
          }
        : prev,
    );
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent
          className={cn(
            'border-0 bg-[#FAF8F4] p-0 overflow-hidden',
            'h-[100dvh] data-[vaul-drawer-direction=bottom]:max-h-none',
            '[&>div:first-child]:hidden',
          )}
        >
          {exp && (
            <>
              <DrawerTitle className="sr-only">{exp.title}</DrawerTitle>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Image carousel */}
                <div className="relative h-[260px] overflow-hidden bg-neutral-200">
                  <AnimatePresence
                    initial={false}
                    custom={sheet?.direction ?? 0}
                  >
                    <motion.div
                      key={sheet?.activeImage ?? 0}
                      custom={sheet?.direction ?? 0}
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
                        const cur = sheet?.activeImage ?? 0;
                        if (info.offset.x < -60 && cur < images.length - 1) {
                          goToImage(cur + 1);
                        } else if (info.offset.x > 60 && cur > 0) {
                          goToImage(cur - 1);
                        }
                      }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={images[sheet?.activeImage ?? 0]}
                        alt={exp.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <Button
                          key={i}
                          onClick={() => goToImage(i)}
                          className={cn(
                            'rounded-full bg-white transition-all duration-300',
                            i === (sheet?.activeImage ?? 0)
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
                  <div className="flex items-start justify-between gap-4">
                    <ExperienceBadge
                      experienceName={exp.category.toUpperCase()}
                    />
                  </div>

                  <h1 className="font-cormorant mt-3 text-[32px] font-medium leading-[1.05] text-[#2B2824]">
                    {exp.title}
                  </h1>

                  {(durationLabel || detail.maxGuests) && (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[2.5px] text-[#797168]">
                      {[
                        durationLabel,
                        detail.maxGuests
                          ? `Up to ${detail.maxGuests} guests`
                          : null,
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
                    <p className="mt-2 text-sm leading-[1.45] text-[#181818]">
                      {detail.about}
                    </p>
                    {detail.longDescription && (
                      <p className="mt-2 text-sm leading-[1.6] text-[#797168]">
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
                            className="flex items-start gap-2.5 text-sm text-[#797168]"
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
                          {detail.availableDate
                            ? ` — ${detail.availableDate}`
                            : ''}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.availableTimes.map((slot) => (
                            <Button
                              key={slot.id}
                              disabled={slot.disabled}
                              onClick={() =>
                                !slot.disabled &&
                                setSheet((prev) =>
                                  prev
                                    ? { ...prev, selectedTimeId: slot.id }
                                    : prev,
                                )
                              }
                              className={cn(
                                'flex items-center gap-1.5 rounded-[6px] border bg-white px-4 py-2 h-[30px] text-[10px] transition-all',
                                sheet?.selectedTimeId === slot.id
                                  ? 'border-[#181818] font-medium text-[#181818]'
                                  : 'border-[#E3E0DA] text-[#797168]',
                                slot.disabled &&
                                  'cursor-not-allowed opacity-40',
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

                  {isLocked && (
                    <>
                      <hr className="my-5 border-[#E3E0DA]" />
                      <div className="flex items-start gap-3 rounded-xl border border-[#E3E0DA] bg-[#F5F3F0] px-4 py-4">
                        <Lock className="mt-0.5 size-4 shrink-0 text-[#797168]" />
                        <p className="text-[12px] leading-[1.5] text-[#797168]">
                          This experience will be available once you check in to
                          the villa.
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
                      onClick={() =>
                        setSheet((prev) =>
                          prev ? { ...prev, showRequestForm: true } : prev,
                        )
                      }
                      className="w-full rounded-[10px] bg-[#181818] h-[42px] text-[10px] font-medium uppercase tracking-[2px] text-white transition-colors active:bg-[#333]"
                    >
                      {isCompleted ? 'Request Again' : 'Request Experience'}
                    </Button>
                  )}
                  {isLocked && (
                    <Button
                      type="button"
                      disabled
                      className="w-full rounded-xl bg-[#E3E0DA] py-4 text-[11px] font-medium uppercase tracking-[2px] text-[#B0AAA0]"
                    >
                      Available After Check-In
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>

      {exp && (
        <RequestExperienceSheet
          open={sheet?.showRequestForm ?? false}
          experience={exp}
          detail={detail}
          preSelectedTimeId={sheet?.selectedTimeId ?? null}
          onClose={() =>
            setSheet((prev) =>
              prev ? { ...prev, showRequestForm: false } : prev,
            )
          }
        />
      )}
    </>
  );
}
