'use client';

import { motion } from 'motion/react';
import { Check, Plus, List } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Drawer, DrawerContent } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';

type GuestAddedSheetProps = {
  open: boolean;
  onClose: () => void;
  guestFirstName: string;
  addedGuests: number;
  totalGuests: number;
  onAddAnother: () => void;
  onViewManifest: () => void;
};

export function GuestAddedSheet({
  open,
  onClose,
  guestFirstName,
  addedGuests,
  totalGuests,
  onAddAnother,
  onViewManifest,
}: GuestAddedSheetProps) {
  const remaining = Math.max(0, totalGuests - addedGuests);
  const allAdded = remaining === 0;
  const pct =
    totalGuests > 0
      ? Math.min(100, Math.round((addedGuests / totalGuests) * 100))
      : 0;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="px-5 pb-10 pt-9 bg-white rounded-t-[20px]">
        <div className="flex flex-col items-center gap-5">
          {/* Check circle */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex items-center justify-center size-[60px] rounded-full bg-[#DCE9DC]"
          >
            <Check className="size-6 text-[#3A5E48]" strokeWidth={2.5} />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-center space-y-1.5"
          >
            <h2 className="font-cormorant text-[24px] font-medium italic text-[#2B2824] leading-tight">
              {guestFirstName} added
            </h2>
            <p className="text-[11px] leading-relaxed text-[#797168]">
              {allAdded
                ? 'All guests have been added. Ready to submit.'
                : `${remaining} more guest${remaining !== 1 ? 's' : ''} to go.`}
            </p>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-2"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
                Guests added
              </span>
              <span className="font-cormorant italic text-[18px] text-[#2B2824] leading-none">
                {addedGuests}
                <span className="text-[#B0AAA0] text-[14px]">
                  {' '}
                  / {totalGuests}
                </span>
              </span>
            </div>
            <div className="h-[3px] rounded-full bg-[#E3E0DA] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#0F1F2E]"
                initial={{ width: '0%' }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
              />
            </div>
          </motion.div>

          {/* Divider */}
          <div className="mx-auto my-1 h-px w-2/3 bg-[#E3E0DA]" />

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full flex flex-col gap-3"
          >
            {!allAdded && (
              <Button
                onClick={onAddAnother}
                className={cn(
                  'h-12 w-full gap-2 rounded-[12px] bg-[#0F1F2E] text-white',
                  'text-[10px] font-semibold uppercase tracking-[2px]',
                  'hover:bg-[#1A3040]',
                )}
              >
                <Plus className="size-4" aria-hidden />
                Add another guest
              </Button>
            )}
            <Button
              onClick={onViewManifest}
              variant="outline"
              className={cn(
                'h-12 w-full gap-2 rounded-[12px] border-[#E3E0DA] bg-white text-[#2B2824]',
                'text-[10px] font-semibold uppercase tracking-[2px]',
                'hover:bg-[#F5F3F0]',
              )}
            >
              <List className="size-4" aria-hidden />
              {allAdded ? 'View guest manifest' : 'View manifest'}
            </Button>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
