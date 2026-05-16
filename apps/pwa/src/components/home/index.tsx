import { ArrivalStatusChip } from '../ArrivalStatusChip';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { HeroCard } from './hero-card';
import { ArrivalCountdown } from '../ArrivalCountdown';
import { GuestManifestPrompt } from './guest-manifest/GuestManifestPrompt';
import { TodaySchedule } from './today-schedule';
import { FeaturedExperiences } from '../featured-experiences';

export const Home = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ArrivalStatusChip arrivalStatus={ArrivalStatus.PRE_ARRIVAL} />
        <div className="text-[#797168] text-[8px] tracking-[3.08px]">
          Sarah H. - Arrives in 2 days
        </div>
      </div>
      <HeroCard />
      <ArrivalCountdown />
      <GuestManifestPrompt />
      <div className="bg-[#E3E0DA] h-[1px]" />
      <TodaySchedule />
      <FeaturedExperiences />
    </div>
  );
};
