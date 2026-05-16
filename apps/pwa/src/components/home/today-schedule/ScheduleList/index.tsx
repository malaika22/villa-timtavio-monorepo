import Link from 'next/link';

import { SCHEDULE_LIST_MOCK } from './mockData';
import { ScheduleCard } from './ScheduleCard';
import { groupItemsByUpcoming } from '@/components/featured-experiences/helpers';
import { MAX_UPCOMING_EXPERIENCES } from './constants';

export const ScheduleList = () => {
  const { current, upcoming } = groupItemsByUpcoming(SCHEDULE_LIST_MOCK);
  const hasUpcomingExperiences = upcoming.length > 0;
  console.log({ current, upcoming });
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {current.map((item) => (
          <ScheduleCard key={item.id} {...item} />
        ))}
      </div>

      {hasUpcomingExperiences && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[8px] uppercase tracking-[1.44px] text-[#797168]">
              Upcoming
            </div>
            <Link
              href="/schedule"
              className="text-xs uppercase tracking-[1.44px] text-[#5C3530]"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, MAX_UPCOMING_EXPERIENCES).map((item) => (
              <ScheduleCard key={item.id} {...item} isUpcomingExperience />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
