'use client';

import { Clock, EyeOff, Users } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { ExperienceGlyphMark } from '@repo/ui';

import { ContentStatusPill } from '@/components/manager/pages/content/ContentStatusPill';
import { ExperienceCardActions } from '@/components/manager/pages/content/ExperienceCardActions';
import { ExperienceToggle } from '@/components/manager/pages/content/ExperienceToggle';
import type { ContentExperience } from '@/types';

type Props = {
  experience: ContentExperience;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  togglePending?: boolean;
};

export const ExperienceCard = ({
  experience,
  onToggle,
  onEdit,
  onDelete,
  togglePending,
}: Props) => {
  const muted = !experience.active;
  const photo = experience.primaryPhotoUrl ?? null;
  const hasPhoto = photo !== null && photo !== '';

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      {/* The same placeholder the guest app draws, rather than a dark tone
          per category. The estate should be looking at what the guest is
          looking at — a tinted panel here and a photograph-shaped gap there
          made "no photo yet" hard to recognise as the same thing. */}
      <div
        className={cn(
          'relative flex h-[148px] flex-col justify-between overflow-hidden p-4',
          !hasPhoto && 'bg-gradient-to-br from-[#EAE5DC] to-[#DED7CB]',
        )}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <ExperienceGlyphMark
              glyph={experience.categoryGlyph}
              className="size-9 text-[#9E9585] opacity-75"
            />
            <span className="h-px w-6 bg-[#B4AC9E] opacity-60" aria-hidden />
            <span className="text-[8px] tracking-[2.2px] text-[#B4AC9E] uppercase">
              Photograph to follow
            </span>
          </div>
        )}
        <div className="relative z-10 flex flex-1 flex-col justify-between">
          <div className="flex justify-end">
            <ExperienceToggle
              active={experience.active}
              onChange={onToggle ? () => onToggle() : undefined}
              pending={togglePending}
            />
          </div>
          <span
            className={cn(
              'font-inter w-fit rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] uppercase backdrop-blur-[2px]',
              // Dark pill over a photograph, light over the placeholder — the
              // white-on-tint it used before is unreadable now the panel is
              // no longer dark.
              hasPhoto
                ? 'bg-black/30 text-white/95'
                : 'bg-[#0F1F2E]/85 text-white',
            )}
          >
            {experience.categoryLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className={cn(
            'font-cormorant text-[22px] leading-tight font-medium',
            muted ? 'text-[#b5aea8]' : 'text-manager-text',
          )}
        >
          {experience.name}
        </h3>

        {muted ? (
          <p className="font-inter mt-1.5 flex items-center gap-1.5 text-xs text-[#a8a29e]">
            <EyeOff className="size-3.5 shrink-0" strokeWidth={1.75} />
            Hidden from guests
          </p>
        ) : null}

        <div
          className={cn(
            'font-inter mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs',
            muted ? 'text-[#c4bdb5]' : 'text-manager-text-muted',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" strokeWidth={1.75} />
            {experience.capacity}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" strokeWidth={1.75} />
            {experience.duration}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <ContentStatusPill type={experience.pricing} muted={muted} />
          <ExperienceCardActions
            muted={muted}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
};
