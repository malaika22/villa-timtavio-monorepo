import { FEATURED_EXPERIENCES_MOCK_DATA } from './mockData';
import Link from 'next/link';
import { ExperienceCard } from '../Experience';

export const FeaturedExperiences = () => {
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
      <div className="flex items-center justify-between gap-3 flex-stretch">
        {FEATURED_EXPERIENCES_MOCK_DATA.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            density="compact"
            className="h-full"
          />
        ))}
      </div>
    </div>
  );
};
