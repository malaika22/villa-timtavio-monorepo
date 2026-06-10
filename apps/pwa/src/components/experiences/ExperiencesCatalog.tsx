'use client';

import type { Experience, ExperienceFilterId } from '@/types/experience';
import { ExperienceCard } from '@/components/Experience';
import { ExperienceDetailSheet } from '@/components/ExperienceDetailSheet';
import { cn } from '@repo/ui/lib/utils';
import { ChevronDown, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EXPERIENCES_MOCK_DATA } from '@/data/experiencesMockData';
import { useCatalog } from '@/hooks/useCatalog';
import { useBookingStore } from '@/store/useBookingStore';
import { mapCatalogItemsToExperiences } from '@/lib/mappers/experience';
import { FilterChips } from './FilterChips';
import { bookingStatusMap, CATALOG_TOTAL, PAGE_SIZE } from './constants';
import { staggerDelay } from './animations';
import { Button } from '@repo/ui/components/button';

export function ExperiencesCatalog() {
  const [filter, setFilter] = useState<ExperienceFilterId>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);

  const bookingStatus = arrivalStatus
    ? bookingStatusMap[arrivalStatus]
    : undefined;

  const { data: catalogItems } = useCatalog();
  const apiExperiences = catalogItems
    ? mapCatalogItemsToExperiences(catalogItems, bookingStatus)
    : null;
  /** Drives RTL collapse: fixed to right edge while shrinking. Cleared after close. */
  const [shrinkFromRight, setShrinkFromRight] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const sourceData = apiExperiences ?? EXPERIENCES_MOCK_DATA;
    let list =
      filter === 'all'
        ? sourceData
        : sourceData.filter((e) => e.filterCategory === filter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.filterCategory.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, searchQuery]);

  const total = filtered.length;
  const catalogTotal = apiExperiences ? apiExperiences.length : CATALOG_TOTAL;
  const visible = filtered.slice(0, visibleCount);
  const remaining = Math.max(0, total - visibleCount);
  const loadedCount = visible.length;

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const countLabel =
    total === catalogTotal
      ? `${catalogTotal} experience${catalogTotal === 1 ? '' : 's'}`
      : `${total} of ${catalogTotal} experience${catalogTotal === 1 ? '' : 's'}`;

  return (
    <div className="mx-auto max-w-md space-y-5 pb-28">
      <header className="space-y-1">
        <h1 className="font-cormorant text-[28px] font-medium italic leading-tight text-[#2B2824]">
          Experiences
        </h1>
        <p className="text-[10px] font-medium uppercase tracking-[2.8px] text-[#797168]">
          {countLabel}
        </p>
      </header>

      <FilterChips
        filter={filter}
        setVisibleCount={setVisibleCount}
        setFilter={setFilter}
      />

      <div className="px-0.5">
        <div className="relative flex h-11 w-full max-w-full items-center overflow-hidden rounded-full border border-[#E3E0DA] bg-white py-0.5 pl-0.5 pr-1 shadow-sm">
          <button
            type="button"
            aria-expanded={searchOpen}
            aria-controls="experiences-search-panel"
            onClick={() => {
              if (searchOpen) {
                setShrinkFromRight(true);
                setSearchOpen(false);
                setSearchQuery('');
                setVisibleCount(PAGE_SIZE);
                searchInputRef.current?.blur();
              } else {
                setShrinkFromRight(false);
                setSearchOpen(true);
              }
            }}
            className="relative z-[2] flex size-9 shrink-0 items-center justify-center rounded-full text-[#797168] transition-colors hover:bg-[#F5F3F0]"
          >
            <span className="relative size-[18px]">
              <Search
                strokeWidth={1.75}
                className={cn(
                  'absolute inset-0 ease-[cubic-bezier(0.32,0.72,0,1)] transition-all duration-[380ms]',
                  searchOpen ? 'scale-90 opacity-0' : 'scale-100 opacity-100',
                )}
                aria-hidden
              />
              <X
                strokeWidth={2}
                className={cn(
                  'absolute inset-0 ease-[cubic-bezier(0.32,0.72,0,1)] transition-all duration-[380ms]',
                  searchOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
                )}
                aria-hidden
              />
            </span>
            <span className="sr-only">
              {searchOpen ? 'Close search' : 'Open search'}
            </span>
          </button>

          <motion.div
            id="experiences-search-panel"
            initial={false}
            className="absolute inset-y-2 left-[42px] right-2 flex min-w-0 items-center gap-1.5"
            style={{
              transformOrigin:
                searchOpen || !shrinkFromRight ? 'left center' : 'right center',
              pointerEvents: searchOpen ? 'auto' : 'none',
              willChange: 'transform',
            }}
            animate={{
              scaleX: searchOpen ? 1 : 0,
            }}
            transition={{
              duration: 0.38,
              ease: [0.32, 0.72, 0, 1],
            }}
            onAnimationComplete={() => {
              if (!searchOpen && shrinkFromRight) {
                setShrinkFromRight(false);
              }
            }}
          >
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search experiences…"
              className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-[#2B2824] outline-none placeholder:text-[#B0AAA0]"
              aria-label="Search experiences"
            />
            {searchQuery ? (
              <Button
                type="button"
                tabIndex={searchOpen ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setVisibleCount(PAGE_SIZE);
                  searchInputRef.current?.focus();
                }}
                className="shrink-0 rounded-full p-1.5 text-[#797168] transition-colors hover:bg-[#F3F1ED]"
                aria-label="Clear search text"
              >
                <X className="size-3.5" strokeWidth={2} aria-hidden />
              </Button>
            ) : null}
          </motion.div>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-2 gap-3 items-stretch">
        {visible.map((exp, index) => (
          <motion.div
            key={exp.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.85,
              delay: staggerDelay(index, loadedCount),
            }}
            className="h-full"
          >
            <ExperienceCard
              experience={exp}
              className="h-full"
              onClick={() => setSelectedExperience(exp)}
            />
          </motion.div>
        ))}
      </motion.div>

      {remaining > 0 ? (
        <motion.button
          type="button"
          layout
          onClick={() =>
            setVisibleCount((n: number) => Math.min(n + PAGE_SIZE, total))
          }
          className="flex w-full items-center justify-center gap-1.5 py-2 text-[10px] font-medium uppercase tracking-[2.8px] text-[#797168] transition-colors hover:text-[#5C534A]"
          whileTap={{ scale: 0.98 }}
        >
          {remaining} more experiences
          <ChevronDown className="size-4" aria-hidden />
        </motion.button>
      ) : null}

      <ExperienceDetailSheet
        open={selectedExperience !== null}
        experience={selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />
    </div>
  );
}
