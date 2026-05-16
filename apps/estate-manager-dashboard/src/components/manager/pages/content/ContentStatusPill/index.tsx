import { cn } from '@repo/ui/lib/utils';

import type { ContentPricingType } from '@/types';

const styles: Record<ContentPricingType, { active: string; muted: string }> = {
  chargeable: {
    active: 'border-[#f0d9d9] bg-[#faf5f4] text-[#b5455a]',
    muted: 'border-[#efe8e8] bg-[#faf8f7] text-[#d4c4c4]',
  },
  included: {
    active: 'border-[#c8e6c9] bg-[#e8f5e9] text-[#2e7d32]',
    muted: 'border-[#e8ebe8] bg-[#f5f7f5] text-[#a8c4ab]',
  },
};

export const ContentStatusPill = ({
  type,
  muted = false,
}: {
  type: ContentPricingType;
  muted?: boolean;
}) => (
  <span
    className={cn(
      'font-inter inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
      muted ? styles[type].muted : styles[type].active,
    )}
  >
    {type}
  </span>
);
