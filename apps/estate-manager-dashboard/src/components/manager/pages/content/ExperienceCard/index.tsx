'use client';

import { Clock, EyeOff, Users } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { ContentStatusPill } from '@/components/manager/pages/content/ContentStatusPill';
import { ExperienceCardActions } from '@/components/manager/pages/content/ExperienceCardActions';
import { experienceImageTones } from '@/components/manager/pages/content/experience-image-tones';
import { ExperienceToggle } from '@/components/manager/pages/content/ExperienceToggle';
import type { ContentExperience } from '@/types';

type Props = {
  experience: ContentExperience;
};

function useCategoryPill(experience: ContentExperience) {
  return !experience.active;
}

export const ExperienceCard = ({ experience }: Props) => {
  const tone = experience.imageTone ?? experience.category;
  const gradient = experienceImageTones[tone] ?? experienceImageTones.dining;
  const categoryPill = useCategoryPill(experience);
  const muted = !experience.active;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      <div
        className={cn(
          'relative flex h-[148px] flex-col justify-between bg-gradient-to-br p-4',
          gradient,
        )}
      >
        <div className="flex justify-end">
          <ExperienceToggle active={experience.active} />
        </div>
        <span
          className={cn(
            'font-inter w-fit text-[10px] font-medium tracking-[0.14em] uppercase',
            categoryPill
              ? 'rounded-full bg-black/30 px-2.5 py-1 text-white/95 backdrop-blur-[2px]'
              : 'text-white/80',
          )}
        >
          {experience.categoryLabel}
        </span>
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
          <ExperienceCardActions muted={muted} />
        </div>
      </div>
    </article>
  );
};
