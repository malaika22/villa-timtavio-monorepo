'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

type Props = {
  active: boolean;
  onChange?: (active: boolean) => void;
  pending?: boolean;
};

export const ExperienceToggle = ({ active, onChange, pending }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    aria-busy={pending}
    disabled={pending}
    onClick={() => onChange?.(!active)}
    className={cn(
      'relative h-6 w-11 shrink-0 rounded-full transition-colors',
      active ? 'bg-[#1e7e34]' : 'bg-[#c4bdb5]',
      pending && 'cursor-wait opacity-70',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform',
        active ? 'left-[22px]' : 'left-0.5',
      )}
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin text-[#8a8178]" />
      ) : null}
    </span>
  </button>
);
