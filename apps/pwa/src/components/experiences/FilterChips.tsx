import { EXPERIENCE_FILTER_CHIPS } from '@/data/experiencesMockData';
import { ExperienceFilterId } from '@/types/experience';
import { cn } from '@repo/ui/lib/utils';
import { PAGE_SIZE } from './constants';

export const FilterChips = ({
  filter,
  setFilter,
  setVisibleCount,
}: {
  filter: ExperienceFilterId;
  setFilter: (filter: ExperienceFilterId) => void;
  setVisibleCount: (count: number) => void;
}) => {
  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1rem),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {EXPERIENCE_FILTER_CHIPS.map((chip) => {
        const active = filter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              setFilter(chip.id);
              setVisibleCount(PAGE_SIZE);
            }}
            className={cn(
              'shrink-0 snap-start rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[1.4px] transition-colors',
              active
                ? 'border-[#181818] bg-[#181818] text-white'
                : 'border-[#E3E0DA] bg-white text-[#5C534A]',
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};
