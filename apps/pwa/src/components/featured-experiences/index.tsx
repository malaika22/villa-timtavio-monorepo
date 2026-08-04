'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ExperienceCard } from '../Experience';
import { ExperienceDetailSheet } from '@/components/ExperienceDetailSheet';
import type { Experience } from '@/types/experience';
import { useCatalog } from '@/hooks/useCatalog';
import { useBookingStore } from '@/store/useBookingStore';
import { mapCatalogItemToExperience } from '@/lib/mappers/experience';
import { ArrivalStatus } from '@/types/arrivalStatus';
import type { BookingStatus } from '@repo/api-types';

export const FeaturedExperiences = () => {
  const { data: catalog, isLoading } = useCatalog();
  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);
  // These cards used to carry no handler at all, so the whole card — Request
  // button included — was inert. Home is where a pre-arrival guest lands, so
  // the estate's own shop window did nothing when tapped.
  const [selected, setSelected] = useState<Experience | null>(null);

  const bookingStatus: BookingStatus =
    arrivalStatus === ArrivalStatus.PRE_ARRIVAL ? 'CONFIRMED' : 'CHECKED_IN';

  const featured = (catalog ?? [])
    .filter((item) => item.isActive)
    .slice(0, 2)
    .map((item) => mapCatalogItemToExperience(item));

  // Don't render the section at all when there are no featured experiences.
  if (!isLoading && featured.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-10">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[1.44px] text-[#797168]">
          Featured Experiences
        </div>
        <Link
          href="/experiences"
          className="text-xs uppercase tracking-[1.44px] text-[#5C3530]"
        >
          SEE ALL
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-[180px] animate-pulse rounded-[10px] bg-[#E3E0DA]"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-stretch">
          {featured.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              density="compact"
              className="h-full"
              onClick={() => setSelected(experience)}
            />
          ))}
        </div>
      )}

      <ExperienceDetailSheet
        open={selected !== null}
        experience={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
