import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

const variants = {
  primary:
    'h-10 w-full rounded-lg border border-[#181818] bg-[#181818] text-[10px] font-medium uppercase tracking-[1.98px] text-white hover:bg-[#333] hover:text-white',
  requestAgain:
    'h-10 w-full rounded-lg border border-[#3D5A45] bg-[#3D5A45] text-[10px] font-medium uppercase tracking-[1.98px] text-white hover:bg-[#32493B] hover:text-white',
};

export type RequestExperienceButtonVariant = keyof typeof variants;

export const RequestExperienceButton = ({
  className,
  variant = 'primary',
}: {
  className?: string;
  variant?: RequestExperienceButtonVariant;
}) => {
  return (
    <Button
      type="button"
      className={cn('w-full uppercase', variants[variant], className)}
    >
      {variant === 'requestAgain' ? 'Request again' : 'Request'}
    </Button>
  );
};
