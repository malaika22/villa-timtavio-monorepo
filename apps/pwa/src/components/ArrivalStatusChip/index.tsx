import { ARRIVAL_STATUS_CHIP_CONFIG } from './constant';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { cn } from '@repo/ui/lib/utils';

export const ArrivalStatusChip = ({
  arrivalStatus = ArrivalStatus.PRE_ARRIVAL,
}: {
  arrivalStatus: ArrivalStatus;
}) => {
  const { label, chipCss, dotColor } =
    ARRIVAL_STATUS_CHIP_CONFIG[arrivalStatus];
  return (
    <div
      className={cn(
        'rounded-full py-1 px-[10px] w-fit text-[10px] uppercase tracking-[1.12px] flex items-center gap-2',
        chipCss,
      )}
    >
      <span
        className={cn('rounded-full w-[5px] h-[5px] inline-block', dotColor)}
      />
      {label}
    </div>
  );
};
