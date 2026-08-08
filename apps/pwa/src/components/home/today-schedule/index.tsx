'use client';
import { ScheduleList } from './ScheduleList';
import { EmptyScheduleCard } from './EmptyScheduleCard';
import { useTodaySchedule } from '@/hooks/useTodaySchedule';
import { useAuth } from '@/hooks/useAuth';

export const TodaySchedule = () => {
  const { isAuthenticated } = useAuth();
  const { todayItems, isLoading } = useTodaySchedule();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-[8px] uppercase tracking-[1.44px] text-[#797168]">
        Today&apos;s Schedule
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 skeleton rounded-[10px] bg-[#E3E0DA]"
            />
          ))}
        </div>
      ) : todayItems.length > 0 ? (
        <ScheduleList items={todayItems} />
      ) : (
        <EmptyScheduleCard />
      )}
    </div>
  );
};
