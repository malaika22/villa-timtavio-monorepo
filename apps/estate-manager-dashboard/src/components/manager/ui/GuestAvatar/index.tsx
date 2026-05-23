import { cn } from '@repo/ui/lib/utils';

export const GuestAvatar = ({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) => (
  <span
    className={cn(
      'flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ebe6df] text-[11px] font-semibold tracking-wide text-[#5e4737]',
      className,
    )}
  >
    {initials}
  </span>
);
