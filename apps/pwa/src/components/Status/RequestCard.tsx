import { cn } from '@repo/ui/lib/utils';

import { STATUS_CHIP_CONFIG } from './chipConfig';
import { StatusChip } from './StatusChip';
import { RequestProgressBar } from './RequestProgressBar';
import { RequestCardProps } from './type';
import { useAuth } from '@/hooks/useAuth';

export function RequestCard({ request, onSelect }: RequestCardProps) {
  const config = STATUS_CHIP_CONFIG[request.status];

  const { email } = useAuth();
  const requesterName = request.requestedByName?.trim();
  const isMine =
    !!request.requestedByEmail &&
    !!email &&
    request.requestedByEmail.toLowerCase() === email.toLowerCase();
  // Show attribution when we know who asked — "You" (gold) for the viewer's own
  // request, otherwise the party member's name. Lets the primary tell their own
  // requests apart from secondaries' on the shared Status list.
  const whoLabel = isMine ? 'You' : requesterName;
  const whoInitial = (isMine ? email : requesterName)
    ?.trim()
    .charAt(0)
    .toUpperCase();

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

      {request.costLabel && (
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-[#8A6D3B]">
            {request.costIsEstimate ? `≈ ${request.costLabel}` : request.costLabel}
          </span>
          <span className="text-[8.5px] font-bold uppercase tracking-[1.3px] text-[#8A6D3B]/85">
            {request.costIsEstimate ? 'Estimate' : 'Confirmed'}
          </span>
        </p>
      )}

      {whoLabel && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={cn(
              'flex size-[15px] items-center justify-center rounded-full text-[8px] font-semibold',
              isMine
                ? 'bg-[#B08D57]/15 text-[#8A6D3B]'
                : 'bg-[#E3E0DA] text-[#797168]',
            )}
            aria-hidden
          >
            {whoInitial}
          </span>
          <span
            className={cn(
              'text-[10px] font-medium',
              isMine ? 'text-[#8A6D3B]' : 'text-[#797168]',
            )}
          >
            {whoLabel}
          </span>
        </div>
      )}

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
