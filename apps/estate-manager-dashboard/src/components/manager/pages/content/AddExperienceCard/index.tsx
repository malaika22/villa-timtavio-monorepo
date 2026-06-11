'use client';

import { Plus } from 'lucide-react';

type Props = {
  onClick?: () => void;
};

export const AddExperienceCard = ({ onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d9d2c8] bg-white text-manager-text-muted transition-colors hover:border-manager-accent hover:text-manager-accent"
  >
    <span className="flex size-10 items-center justify-center rounded-full border border-current">
      <Plus className="size-5" strokeWidth={1.75} />
    </span>
    <span className="font-inter mt-3 text-sm font-medium">Add Experience</span>
  </button>
);
