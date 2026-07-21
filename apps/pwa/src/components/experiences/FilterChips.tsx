import { cn } from '@repo/ui/lib/utils';
import { PAGE_SIZE } from './constants';

export const FilterChips = ({
  filter,
  setFilter,
  setVisibleCount,
  categories,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  setVisibleCount: (count: number) => void;
  /** Distinct category names of the loaded experiences (EM-configured). */
  categories: string[];
}) => {
  const chips = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c, label: c })),
  ];
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1rem),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1rem),transparent)]">
      {chips.map((chip) => {
        const active = filter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setFilter(chip.id);
              setVisibleCount(PAGE_SIZE);
            }}
            className={cn(
              'shrink-0 snap-start rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[1.6px] transition-all duration-300 ease-out active:scale-[0.97]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96E]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#F0EDE6]',
              active
                ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white shadow-[0_2px_8px_rgba(15,31,46,0.18)]'
                : 'border-[#E3E0DA] bg-[#FAF9F7] text-[#797168] hover:border-[#D4CDBF] hover:text-[#2B2824]',
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};
