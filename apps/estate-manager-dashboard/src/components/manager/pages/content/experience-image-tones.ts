import type { ContentExperience } from '@/types';

export const experienceImageTones: Record<
  NonNullable<ContentExperience['imageTone']>,
  string
> = {
  dining: 'from-[#3d2c28] via-[#2a1f1c] to-[#1a1514]',
  water: 'from-[#2a3540] via-[#1e2830] to-[#141a20]',
  wellness: 'from-[#2d3530] via-[#222a25] to-[#181e1a]',
  wine: 'from-[#352a2e] via-[#261e22] to-[#181416]',
  culture: 'from-[#2a2620] via-[#1f1c18] to-[#141210]',
  inactive: 'from-[#5a6570] via-[#4a5560] to-[#3a4248]',
};
