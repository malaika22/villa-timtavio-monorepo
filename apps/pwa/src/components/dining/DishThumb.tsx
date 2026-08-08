'use client';

import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

/**
 * A dish's photograph, or something deliberate in its absence.
 *
 * A missing photo used to render nothing at all, so a menu of half-photographed
 * dishes came out ragged — some rows indented, some not — which reads as broken
 * rather than as incomplete. The placeholder holds the same space and says the
 * photo is coming, which is true and looks intended.
 */
export const DishThumb = ({
  photoUrl,
  name,
  size = 'sm',
  className,
}: {
  photoUrl?: string | null;
  name: string;
  /** `lg` has room for the words; `sm` is the icon alone. */
  size?: 'sm' | 'lg';
  className?: string;
}) => {
  const box =
    size === 'lg'
      ? 'size-20 rounded-[12px]'
      : 'size-14 rounded-[10px]';

  if (photoUrl) {
    return (
      // External CDN image — deliberately a plain <img>.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        data-fade
        // Tied to the picture arriving rather than to a timer, so a cached
        // image is already opaque on the first frame and a slow one doesn't
        // fade in before it has anything to show.
        onLoad={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
        onError={(e) => e.currentTarget.setAttribute('data-loaded', 'true')}
        ref={(el) => {
          // Fired before React attached the handler — a decoded image from the
          // memory cache never emits load again, and would stay invisible.
          if (el?.complete) el.setAttribute('data-loaded', 'true');
        }}
        className={cn(box, 'shrink-0 object-cover', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        box,
        'flex shrink-0 flex-col items-center justify-center gap-0.5',
        'border border-[#E3E0DA] bg-gradient-to-br from-[#FBF3DF] to-[#F0EDE6]',
        className,
      )}
      // The dish's own name is already beside this in every layout, so the
      // placeholder is decoration to a screen reader.
      aria-hidden
    >
      <UtensilsCrossed
        className={cn('text-[#B08D57]', size === 'lg' ? 'size-5' : 'size-4')}
        strokeWidth={1.5}
      />
      {size === 'lg' && (
        <span className="text-[7px] font-medium uppercase tracking-[0.8px] text-[#9A8A6B]">
          Photo soon
        </span>
      )}
    </span>
  );
};
