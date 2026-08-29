import type { Experience } from '@/types/experience';
import { ExperienceStatus } from '@/types/experienceStatus';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import Image from 'next/image';
import { ExperiencePhotoPlaceholder } from '@repo/ui';
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
  const { category, title, image, glyph } = experience;

  // src="" renders the browser's broken-image icon, which is what a guest
  // saw on the home screen for every experience the estate hasn't
  // photographed yet.
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!image && !imgFailed;

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
        'group flex flex-1 flex-col overflow-hidden rounded-[14px] border border-[#E3E0DA] bg-white shadow-[0_1px_6px_rgba(15,31,46,0.06)] transition-shadow',
        onClick &&
          'cursor-pointer hover:shadow-[0_4px_16px_rgba(15,31,46,0.10)]',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-full shrink-0 overflow-hidden rounded-t-[14px]',
          imageHeight,
        )}
      >
        {showImage ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ExperiencePhotoPlaceholder
            glyph={glyph}
            scale={density === 'compact' ? 'compact' : 'card'}
          />
        )}
        {/* Bottom scrim for depth + legibility */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent"
          aria-hidden
        />
        <div className="absolute left-2 top-2 z-[2]">
          <ExperienceBadge experienceName={category.toUpperCase()} />
        </div>
        {isLocked ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#0F1F2E]/70 via-[#0F1F2E]/40 to-[#0F1F2E]/25"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
              aria-hidden
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-[2px]',
                  density === 'compact' ? 'size-8' : 'size-10',
                )}
              >
                <Lock
                  className={
                    density === 'compact'
                      ? 'size-4 text-white'
                      : 'size-5 text-white'
                  }
                  strokeWidth={2}
                />
              </span>
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
