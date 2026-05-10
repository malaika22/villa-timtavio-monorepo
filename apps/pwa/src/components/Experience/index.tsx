import type { Experience } from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import { cn } from '@repo/ui/lib/utils';
import Image from 'next/image';
import { Lock } from 'lucide-react';

import { ExperienceBadge } from '../featured-experiences/ExperienceBadge';
import { ActionStrip } from './ActionStrip';

export function formatExperienceMeta(experience: Experience): string {
  const duration =
    experience.durationMinutes != null
      ? `${experience.durationMinutes} MIN`
      : `${experience.experienceHours ?? 0} HRS`;
  return `${duration}`;
}

export const ExperienceCard = ({
  experience,
  density = 'default',
  className,
  onClick,
}: {
  experience: Experience;
  density?: 'default' | 'compact';
  className?: string;
  onClick?: () => void;
}) => {
  const isLocked = experience.status === ExperienceStatus.LOCKED_PRE_ARRIVAL;
  const { category, title, image } = experience;

  const imageHeight =
    density === 'compact' ? 'h-[58px]' : 'h-[112px] sm:h-[118px]';
  const titleSize = density === 'compact' ? 'text-sm' : 'text-[15px]';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={cn(
        'flex flex-1 flex-col overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_4px_rgba(15,31,46,0.04)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-full shrink-0 overflow-hidden rounded-t-[10px]',
          imageHeight,
        )}
      >
        <Image src={image} alt={title} fill className="object-cover" />
        <div className="absolute left-2 top-2 z-[2]">
          <ExperienceBadge experienceName={category.toUpperCase()} />
        </div>
        {isLocked ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-[rgba(128,128,128,0.5)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
              aria-hidden
            >
              <Lock
                className={
                  density === 'compact'
                    ? 'size-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]'
                    : 'size-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]'
                }
                strokeWidth={2}
              />
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-[10px] pb-3 pt-2">
        <h3
          className={cn(
            'font-cormorant font-medium  text-[#181818] leading-[15.6px]!important',
            titleSize,
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'mt-0.5 uppercase tracking-[3.08px] text-[#797168]',
            density === 'compact' ? 'text-xs' : 'text-[10px]',
          )}
        >
          {formatExperienceMeta(experience)}
        </p>
        <div className={cn('mt-auto', density === 'compact' ? 'pt-0' : 'pt-2')}>
          <ActionStrip experienceStatus={experience.status} />
        </div>
      </div>
    </div>
  );
};
