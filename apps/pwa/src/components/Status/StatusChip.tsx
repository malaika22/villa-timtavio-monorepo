import { cn } from '@repo/ui/lib/utils';
import { STATUS_CHIP_CONFIG, StatusRequestKey } from './chipConfig';

export const StatusChip = ({
  requestStatus,
}: {
  requestStatus: StatusRequestKey;
}) => {
  const config = STATUS_CHIP_CONFIG[requestStatus];
  return (
    <div
      className={cn(
        'mt-0.5 shrink-0 rounded-full border py-[4px]  px-[10px] text-[8px] font-semibold uppercase tracking-[1.12px]',
        config.chip,
      )}
      role="status"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn('inline-block size-[5px] rounded-full', config.dot)}
          aria-hidden
        />
        {config.label}
      </span>
    </div>
  );
};
