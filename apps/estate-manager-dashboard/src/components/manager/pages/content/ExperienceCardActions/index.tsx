'use client';

import { cn } from '@repo/ui/lib/utils';

type Props = {
  muted?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const ExperienceCardActions = ({
  muted = false,
  onEdit,
  onDelete,
}: Props) => (
  <div className={cn('flex items-center gap-2', muted && 'opacity-55')}>
    <button
      type="button"
      onClick={onEdit}
      className="font-inter h-8 rounded-md border border-[#e5e0d8] bg-white px-3.5 text-xs font-medium text-manager-text shadow-none transition-colors hover:bg-[#faf9f7]"
    >
      Edit
    </button>
    <button
      type="button"
      onClick={onDelete}
      className="font-inter h-8 rounded-md border border-[#f5d0d6] bg-[#fce8ea] px-3.5 text-xs font-medium text-[#b5455a] shadow-none transition-colors hover:bg-[#fbe0e4]"
    >
      Delete
    </button>
  </div>
);
