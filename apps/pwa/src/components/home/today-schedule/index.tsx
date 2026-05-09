import { EmptyScheduleCard } from './EmptyScheduleCard';

export const TodaySchedule = () => {
  return (
    <div className="space-y-4">
      <div className="text-[#797168] tracking-[1.44px] text-[8px]  uppercase">
        Today&apos;s Schedule
      </div>
      <EmptyScheduleCard />
    </div>
  );
};
