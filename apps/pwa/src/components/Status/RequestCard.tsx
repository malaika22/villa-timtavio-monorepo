import { cn } from '@repo/ui/lib/utils';

import { STATUS_CHIP_CONFIG } from './chipConfig';
import { StatusChip } from './StatusChip';
import { RequestProgressBar } from './RequestProgressBar';
import { RequestCardProps } from './type';

export function RequestCard({ request, onSelect }: RequestCardProps) {
  const config = STATUS_CHIP_CONFIG[request.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(request.id)}
      className={cn(
        'w-full text-left rounded-[10px] border border-[#E3E0DA] bg-white px-4 py-3.5',
        'border-l-[3px]',
        config.cardBorderLeft,
        'shadow-[0_1px_3px_rgba(15,31,46,0.04)]',
        'transition-shadow hover:shadow-[0_2px_8px_rgba(15,31,46,0.08)]',
        'active:scale-[0.99]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-cormorant text-[17px] font-medium leading-tight text-[#2B2824]">
          {request.title}
        </h3>
        <StatusChip requestStatus={request.status} />
      </div>

      <p className="mt-[2px] text-[9px] font-medium uppercase tracking-[1.4px] text-[#797168]">
        {request.date} · {request.time} · {request.meta}
      </p>

      <RequestProgressBar
        progressLabel={request.progressLabel}
        progressPercent={request.progressPercent}
      />

      {request.description && (
        <p className="mt-1 text-[11px] leading-snug text-[#797168]">
          {request.description}
        </p>
      )}
    </button>
  );
}
