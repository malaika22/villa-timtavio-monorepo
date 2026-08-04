'use client';

import { cn } from '@repo/ui/lib/utils';

const variants = {
  primary:
    'h-10 w-full rounded-lg border border-[#181818] bg-[#181818] text-[10px] font-medium uppercase tracking-[1.98px] text-white hover:bg-[#333] hover:text-white',
  requestAgain:
    'h-10 w-full rounded-lg border border-[#3D5A45] bg-[#3D5A45] text-[10px] font-medium uppercase tracking-[1.98px] text-white hover:bg-[#32493B] hover:text-white',
};

export type RequestExperienceButtonVariant = keyof typeof variants;

/**
 * The call to action on an experience card.
 *
 * Deliberately NOT a button: the whole card is the control, and this is its
 * label. It used to render a real `<button>` with no handler — which took
 * keyboard focus, announced itself as a button and did nothing when activated.
 * It only appeared to work because a click bubbled to the card behind it, so
 * it broke the moment a card forgot to pass one.
 *
 * Rendering it as presentation makes the card the single, honest target.
 */
export const RequestExperienceButton = ({
  className,
  variant = 'primary',
}: {
  className?: string;
  variant?: RequestExperienceButtonVariant;
  confirmationMessage?: string;
}) => {
  return (
    <span
      aria-hidden
      className={cn(
        'flex w-full items-center justify-center uppercase',
        variants[variant],
        className,
      )}
    >
      {variant === 'requestAgain' ? 'Request again' : 'Request'}
    </span>
  );
};
