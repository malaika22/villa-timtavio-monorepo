import { formatTimeLabel } from '@/helpers/formatDate';
import type { ScheduleEvent } from './mockData';
import { ExperienceStatusChip } from '@/components/ExperienceStatusChip';
import { cn } from '@repo/ui/lib/utils';

interface ScheduleCardProps extends ScheduleEvent {
  isUpcomingExperience?: boolean;
}

export function ScheduleCard({
  scheduledTime,
  title,
  location,
  status,
  isUpcomingExperience = false,
}: ScheduleCardProps) {
  return (
    <article
      className={cn(
        'rounded-[12px] border border-[#E3E0DA] bg-white px-3 py-3 shadow-[0_1px_4px_rgba(15,31,46,0.06)]',
        isUpcomingExperience && 'border-[#E3E0DA] bg-[#F5F3F0]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[8px] font-medium uppercase tracking-[3.08px] text-[#797168]">
            {formatTimeLabel(scheduledTime)}
          </p>
          <h3 className="font-cormorant text-[16px] font-medium leading-snug tracking-tight text-[#2B2824]">
            {title}
          </h3>
          {location && (
            <p className="text-[8px] uppercase tracking-[3.08px] text-[#797168]">
              {location}
            </p>
          )}
        </div>
        <ExperienceStatusChip experienceStatus={status} />
      </div>
    </article>
  );
}
