'use client';
import { ArrivalStatusChip } from '../ArrivalStatusChip';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { HeroCard } from './hero-card';
import { ArrivalCountdown } from '../ArrivalCountdown';
import { GuestManifestPrompt } from './guest-manifest/GuestManifestPrompt';
import { TodaySchedule } from './today-schedule';
import { FeaturedExperiences } from '../featured-experiences';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentBooking } from '@/hooks/useBooking';
import { useManifest } from '@/hooks/useManifest';

export const Home = () => {
  const { isAuthenticated, firstName } = useAuth();
  // Trigger booking fetch and populate store
  useCurrentBooking();

  const arrivalStatus = useBookingStore((s) => s.arrivalStatus);
  const checkIn = useBookingStore((s) => s.checkIn);
  const manifestStatus = useBookingStore((s) => s.manifestStatus);
  const { data: manifest } = useManifest();

  const displayArrivalStatus = arrivalStatus ?? ArrivalStatus.PRE_ARRIVAL;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ArrivalStatusChip arrivalStatus={displayArrivalStatus} />
        {firstName && checkIn && (
          <div className="text-[#797168] text-[8px] tracking-[3.08px]">
            {firstName}
          </div>
        )}
      </div>
      <HeroCard />
      <ArrivalCountdown />
      {isAuthenticated && manifestStatus !== 'APPROVED' && (
        <GuestManifestPrompt guestsAdded={manifest?.addedGuests ?? 0} />
      )}
      <div className="bg-[#E3E0DA] h-[1px]" />
      <TodaySchedule />
      <FeaturedExperiences />
    </div>
  );
};
