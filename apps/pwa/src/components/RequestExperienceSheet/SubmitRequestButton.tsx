import { Button } from '@repo/ui/components/button';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';
import { Bell, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  confirmationMessage?: string;
  onSubmit?: () => Promise<void>;
  disabled?: boolean;
}

export const SubmitRequestButton = ({
  confirmationMessage = "We'll confirm your request within the hour. You'll be notified.",
  onSubmit,
  disabled,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit();
      } finally {
        setIsSubmitting(false);
      }
    }
    setOpen(true);
  };

  const handleTrackRequest = () => {
    setOpen(false);
    router.push('/status');
  };

  const handleBackToExperiences = () => {
    setOpen(false);
    router.push('/experiences');
  };
  return (
    <>
      <Button
        type="button"
        className="w-full rounded-xl bg-[#181818] py-4 text-[11px] font-medium uppercase tracking-[2px] text-white transition-colors active:bg-[#333] disabled:opacity-60"
        onClick={handleSubmit}
        disabled={disabled || isSubmitting}
      >
        Submit Request
      </Button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        data-slot="request-experience-drawer"
      >
        <DrawerContent
          className={cn(
            'border-none bg-[#0F0E0C]',
            'rounded-t-[28px]',
            'px-5 pb-10 pt-8',
            'flex flex-col items-center gap-5',
            // suppress the default top handle (for bottom drawers)
            '[&>div:first-child]:hidden',
          )}
        >
          {/* Accessible title */}
          <DrawerTitle className="sr-only">Request received</DrawerTitle>

          {/* Bell icon */}
          <div className="flex items-center justify-center size-[72px] rounded-full bg-[#1E1E1B]">
            <div className="flex items-center justify-center size-12 rounded-full bg-[#2C2B27]">
              <Bell size={20} className="text-[#D9D5CE]" strokeWidth={1.5} />
            </div>
          </div>

          {/* Confirmation label */}
          <p className="text-[9px] font-semibold uppercase tracking-[2.5px] text-[#5C5A54]">
            Confirmation
          </p>

          {/* Heading */}
          <h2 className="font-cormorant text-[36px] font-medium italic leading-[1.1] text-[#F0EDE6] text-center -mt-2">
            Request
            <br />
            received.
          </h2>

          {/* Body text */}
          <p className="text-center text-[13px] font-light leading-relaxed text-[#6B6860] max-w-[260px] -mt-1">
            {confirmationMessage}
          </p>

          {/* CTAs */}
          <div className="w-full flex flex-col gap-3 mt-2">
            <button
              type="button"
              onClick={handleTrackRequest}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'rounded-[12px] bg-[#2D5A3D] py-4',
                'text-[10px] font-semibold uppercase tracking-[2px] text-white',
                'transition-colors hover:bg-[#244D34] active:opacity-80',
              )}
            >
              Track your request
              <ArrowRight size={12} aria-hidden />
            </button>

            <button
              type="button"
              onClick={handleBackToExperiences}
              className={cn(
                'w-full rounded-[12px] border border-[#2C2B27] bg-[#1A1916] py-4',
                'text-[10px] font-semibold uppercase tracking-[2px] text-[#9A9288]',
                'transition-colors hover:bg-[#222220] active:opacity-80',
              )}
            >
              Back to experiences
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
