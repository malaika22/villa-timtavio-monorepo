'use client';

import type { Experience } from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import { ExperienceStatusChip } from '@/components/ExperienceStatusChip';
import { cn } from '@repo/ui/lib/utils';
import Image from 'next/image';
import { Clock, Lock, ArrowUpRight, ImageIcon } from 'lucide-react';
import { useState } from 'react';

function durationLabel(experience: Experience): string {
  if (experience.durationMinutes != null) {
    return `${experience.durationMinutes} min`;
  }
  return `${experience.experienceHours ?? 0} hrs`;
}

/**
 * Catalog-only, luxury redesign of the experience tile. Same props/data and the
 * same click-to-open-detail behavior as the shared card — presentation only.
 */
export const ExperienceCatalogCard = ({
  experience,
  className,
  onClick,
}: {
  experience: Experience;
  className?: string;
  onClick?: () => void;
}) => {
  const { category, title, image, status } = experience;
  const isLocked = status === ExperienceStatus.LOCKED_PRE_ARRIVAL;
  const isAvailable = status === ExperienceStatus.AVAILABLE;
  const isCompleted = status === ExperienceStatus.COMPLETED;

  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!image && !imgFailed;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'group flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[#E3E0DA] bg-[#FAF9F7]',
        'shadow-[0_1px_3px_rgba(15,31,46,0.05)] transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-[#D8D2C7] hover:shadow-[0_6px_20px_rgba(15,31,46,0.10)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96E]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0EDE6]',
        'active:scale-[0.985]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* ─── Image ──────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#EAE5DC] to-[#DED7CB]">
        {showImage ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 448px) 50vw, 224px"
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            aria-hidden
          >
            <ImageIcon className="size-6 text-[#B4AC9E]" strokeWidth={1.5} />
          </div>
        )}

        {/* Legibility gradient for the overlaid category label */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0F1F2E]/80 via-[#0F1F2E]/25 to-transparent"
          aria-hidden
        />

        {/* Category — small, uppercase, tracked, over the gradient */}
        <span className="absolute bottom-2.5 left-3 right-3 z-[2] truncate text-[9px] font-semibold uppercase tracking-[2.4px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {category}
        </span>

        {isLocked ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-[3] bg-[#0F1F2E]/45 backdrop-blur-[1px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center"
              aria-hidden
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-[#0F1F2E]/50">
                <Lock
                  className="size-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                  strokeWidth={2}
                />
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ─── Body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <h3 className="font-cormorant text-[17px] font-medium leading-[1.15] text-[#2B2824]">
          {title}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-[#797168]">
          <Clock className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="text-[9.5px] font-medium uppercase tracking-[2.2px]">
            {durationLabel(experience)}
          </span>
        </div>

        {/* Footer / CTA — understated, theme-consistent */}
        <div className="mt-3 border-t border-[#EAE6DF] pt-2.5">
          {isLocked ? (
            <p className="text-[8.5px] font-medium uppercase tracking-[2.4px] text-[#9A9288]">
              Available at check-in
            </p>
          ) : isAvailable ? (
            <span className="flex items-center justify-between text-[#0F1F2E]">
              <span className="text-[9.5px] font-semibold uppercase tracking-[2.2px]">
                Request
              </span>
              <ArrowUpRight
                className="size-3.5 text-[#C8A96E] transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </span>
          ) : isCompleted ? (
            <span className="flex items-center justify-between gap-2">
              <ExperienceStatusChip
                experienceStatus={status}
                className="mt-0 w-fit"
              />
              <span className="text-[9px] font-semibold uppercase tracking-[2px] text-[#3D5A45]">
                Request again
              </span>
            </span>
          ) : (
            <ExperienceStatusChip
              experienceStatus={status}
              className="mt-0 w-fit"
            />
          )}
        </div>
      </div>
    </div>
  );
};
