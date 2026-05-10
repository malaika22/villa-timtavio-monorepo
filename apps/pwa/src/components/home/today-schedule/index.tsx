import { ScheduleList } from './ScheduleList';
import { EmptyScheduleCard } from './EmptyScheduleCard';

/** Toggle when wiring real schedule data */
const hasSchedule = true;

export const TodaySchedule = () => {
  return (
    <div className="space-y-4">
      <div className="text-[8px] uppercase tracking-[1.44px] text-[#797168]">
        Today&apos;s Schedule
      </div>
      {hasSchedule ? <ScheduleList /> : <EmptyScheduleCard />}
    </div>
  );
};
