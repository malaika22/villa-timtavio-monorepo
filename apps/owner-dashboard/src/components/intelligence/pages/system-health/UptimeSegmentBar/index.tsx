import type { UptimeSegmentStatus } from '@/types';

const segmentColor: Record<UptimeSegmentStatus, string> = {
  operational: 'bg-[#4a6d55]',
  degraded: 'bg-[#d4a373]',
  outage: 'bg-[#a64b4b]',
};

export const UptimeSegmentBar = ({ segments }: { segments: UptimeSegmentStatus[] }) => (
  <div className="flex h-6 flex-1 gap-px overflow-hidden rounded-sm">
    {segments.map((status, i) => (
      <div
        key={i}
        className={`min-w-[2px] flex-1 ${segmentColor[status]}`}
        title={status}
      />
    ))}
  </div>
);
