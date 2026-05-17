import { cn } from '@repo/ui/lib/utils';
import { RequestCardProps } from './type';
import { STATUS_CHIP_CONFIG } from './chipConfig';
import { ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui';
import { StatusChip } from './StatusChip';
import { RequestProgressBar } from './RequestProgressBar';
import Link from 'next/link';

export function RequestCard({ request }: RequestCardProps) {
  const config = STATUS_CHIP_CONFIG[request.status];

  return (
    <div
      className={cn(
        'rounded-[10px] border border-[#E3E0DA] bg-white px-4 py-3.5',
        'border-l-[3px]',
        config.cardBorderLeft,
        'shadow-[0_1px_3px_rgba(15,31,46,0.04)]',
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

      {/* View details link */}
      {request.showViewDetails && (
        <>
          <hr className="my-2 border-[#EDEBE6]" />
          <Button
            asChild
            variant="ghost"
            className="w-fit h-fit p-0 flex items-center gap-1 text-[10px] font-medium text-[#3A7A50] transition-opacity hover:opacity-70"
          >
            <Link href={`/status/${request.id}`}>
              View details
              <ArrowRight size={10} aria-hidden />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
