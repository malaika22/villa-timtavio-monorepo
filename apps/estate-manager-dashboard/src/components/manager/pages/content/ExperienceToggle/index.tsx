'use client';

import { cn } from '@repo/ui/lib/utils';

type Props = {
  active: boolean;
  onChange?: (active: boolean) => void;
};

export const ExperienceToggle = ({ active, onChange }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={() => onChange?.(!active)}
    className={cn(
      'relative h-6 w-11 shrink-0 rounded-full transition-colors',
      active ? 'bg-[#1e7e34]' : 'bg-[#c4bdb5]',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
        active ? 'left-[22px]' : 'left-0.5',
      )}
    />
  </button>
);
