'use client';

import type { Experience } from '@/types/experience';
import { ExperienceCatalogCard } from './ExperienceCatalogCard';
import { ExperienceDetailSheet } from '@/components/ExperienceDetailSheet';
import { cn } from '@repo/ui/lib/utils';
import { ChevronDown, Compass, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useBookingStore } from '@/store/useBookingStore';
import { mapCatalogItemsToExperiences } from '@/lib/mappers/experience';
import { FilterChips } from './FilterChips';
import { bookingStatusMap, PAGE_SIZE } from './constants';
import { staggerDelay } from './animations';
import { LoadFailed } from '@/components/LoadFailed';

export function ExperiencesCatalog() {
  const [filter, setFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);

  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);

  const bookingStatus = arrivalStatus
    ? bookingStatusMap[arrivalStatus]
    : undefined;

  const { data: catalogItems, isLoading, isError, refetch, isFetching } =
    useCatalog();
  const apiExperiences = useMemo(
    () =>
      catalogItems
        ? mapCatalogItemsToExperiences(catalogItems)
        : null,
    [catalogItems, bookingStatus],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Distinct dynamic categories of the loaded experiences drive the chips.
  const categories = useMemo(
    () =>
      Array.from(new Set((apiExperiences ?? []).map((e) => e.filterCategory))),
    [apiExperiences],
  );

  const filtered = useMemo(() => {
    const sourceData = apiExperiences ?? [];
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
  }, [apiExperiences, filter, searchQuery]);

  const total = filtered.length;
  const catalogTotal = apiExperiences?.length ?? 0;
  const visible = filtered.slice(0, visibleCount);
  const remaining = Math.max(0, total - visibleCount);
  const loadedCount = visible.length;

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
        categories={categories}
      />

      <div className="px-0.5">
        <div
          className={cn(
            'group flex h-11 w-full items-center gap-2.5 rounded-full border bg-[#FAF9F7] pl-4 pr-2',
            'border-[#E3E0DA] shadow-[0_1px_2px_rgba(15,31,46,0.04)]',
            'transition-all duration-300 ease-out',
            'focus-within:border-[#C8A96E] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,169,110,0.22)]',
          )}
        >
          <Search
            className="size-4 shrink-0 text-[#9A9288] transition-colors duration-300 group-focus-within:text-[#0F1F2E]"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search experiences…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#2B2824] outline-none [appearance:none] placeholder:text-[#B0AAA0] [&::-webkit-search-cancel-button]:appearance-none"
            aria-label="Search experiences"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setVisibleCount(PAGE_SIZE);
                searchInputRef.current?.focus();
              }}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#797168] transition-colors hover:bg-[#F0EDE6] hover:text-[#2B2824]"
              aria-label="Clear search text"
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {isError ? (
          <LoadFailed
            what="the experiences"
            onRetry={() => void refetch()}
            retrying={isFetching}
          />
        ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[16px] border border-[#E3E0DA] bg-[#FAF9F7]"
            >
              <div className="aspect-[4/3] w-full skeleton bg-[#E8E5E0]" />
              <div className="flex flex-col gap-2 px-3 pb-3 pt-3">
                <div className="h-3.5 w-4/5 skeleton rounded-full bg-[#E8E5E0]" />
                <div className="h-2.5 w-2/5 skeleton rounded-full bg-[#ECE9E4]" />
                <div className="mt-1 h-2.5 w-1/2 skeleton rounded-full bg-[#ECE9E4]" />
              </div>
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <div className="mt-2 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#E3D9CD] bg-[#FAF8F4] px-6 py-12 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full border border-[#E3D9CD] bg-[#F3EDE4]">
            <Compass className="size-5 text-[#8C7261]" strokeWidth={2} aria-hidden />
          </span>
          <p className="font-cormorant text-[18px] text-[#2B2824]">
            {catalogTotal === 0
              ? 'No experiences available yet'
              : 'No experiences match your search'}
          </p>
          <p className="mt-1.5 max-w-[250px] text-[11px] leading-snug text-[#797168]">
            {catalogTotal === 0
              ? 'Your host is still curating the collection. Check back soon for curated adventures, dining, and wellness.'
              : 'Try a different category or clear your search to see the full collection.'}
          </p>
        </div>
      ) : (
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
              <ExperienceCatalogCard
                experience={exp}
                className="h-full"
                onClick={() => setSelectedExperience(exp)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {remaining > 0 && !isLoading ? (
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
