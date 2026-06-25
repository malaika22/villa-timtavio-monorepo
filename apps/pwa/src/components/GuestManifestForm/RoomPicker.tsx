'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Check, Lock, Info, BedDouble, Bath } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { isRoomFull, type RoomOption } from './rooms';

type RoomPickerProps = {
  rooms: RoomOption[];
  value: string;
  onChange: (id: string) => void;
  /** When provided, each row shows an info button that opens the detail sheet */
  onShowDetails?: (id: string) => void;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: 'easeOut' as const },
  },
};

export function RoomPicker({
  rooms,
  value,
  onChange,
  onShowDetails,
}: RoomPickerProps) {
  return (
    <motion.div
      role="radiogroup"
      aria-label="Select a room"
      className="flex flex-col gap-2.5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {rooms.map((room) => {
        const full = isRoomFull(room);
        const selected = value === room.id;
        const remaining = Math.max(room.capacity - room.filled, 0);
        const beds = room.totalBeds ?? room.capacity;

        return (
          <motion.div
            key={room.id}
            variants={cardVariants}
            className="relative"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={full}
              disabled={full}
              onClick={() => !full && onChange(room.id)}
              className={cn(
                'relative flex w-full items-center gap-3 overflow-hidden rounded-[14px] border px-3.5 py-3 text-left transition-colors duration-200',
                full
                  ? 'cursor-not-allowed border-dashed border-[#D8D3CC] bg-[#F5F3F0] opacity-70'
                  : selected
                    ? 'border-[#0F1F2E] bg-[#0F1F2E] shadow-[0_4px_16px_rgba(15,31,46,0.18)]'
                    : 'border-[#E3E0DA] bg-white hover:border-[#C9C4BC]',
              )}
            >
              {/* Selected sliding highlight */}
              {selected && !full && (
                <motion.span
                  layoutId="room-pick-glow"
                  className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/10"
                  transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                />
              )}

              {/* Room number badge */}
              <div
                className={cn(
                  'relative flex size-9 shrink-0 items-center justify-center rounded-full font-cormorant text-[16px] italic transition-colors',
                  full
                    ? 'bg-[#E7E2DB] text-[#9A9288]'
                    : selected
                      ? 'bg-white text-[#0F1F2E]'
                      : 'bg-[#F0EDE8] text-[#2B2824]',
                )}
              >
                {room.id}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[12.5px] font-medium leading-tight transition-colors',
                    full
                      ? 'text-[#9A9288]'
                      : selected
                        ? 'text-white'
                        : 'text-[#2B2824]',
                  )}
                >
                  {room.suiteLabel}
                </p>

                {/* Inline bed/bath summary */}
                <div
                  className={cn(
                    'mt-0.5 flex items-center gap-2.5 text-[9px] transition-colors',
                    selected && !full ? 'text-white/60' : 'text-[#9A9288]',
                  )}
                >
                  <span className="inline-flex items-center gap-0.5">
                    <BedDouble className="size-2.5" aria-hidden />
                    {beds} bed{beds === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Bath className="size-2.5" aria-hidden />
                    {room.bathrooms ?? 1} bath
                    {(room.bathrooms ?? 1) === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Capacity dots */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex gap-[3px]">
                    {Array.from({ length: room.capacity }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={false}
                        animate={{
                          backgroundColor: full
                            ? i < room.filled
                              ? '#B0AAA0'
                              : '#DDD9D3'
                            : selected
                              ? i < room.filled
                                ? 'rgba(255,255,255,0.45)'
                                : 'rgba(255,255,255,0.9)'
                              : i < room.filled
                                ? '#0F1F2E'
                                : '#DDD9D3',
                          scale: i < room.filled ? 1 : 0.8,
                        }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="size-[6px] rounded-full"
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-medium transition-colors',
                      full
                        ? 'text-[#A8917F]'
                        : selected
                          ? 'text-white/70'
                          : 'text-[#9A9288]',
                    )}
                  >
                    {full
                      ? 'Full'
                      : `${remaining} spot${remaining === 1 ? '' : 's'} left`}
                  </span>
                </div>
              </div>

              {/* Trailing indicator (leaves room for the info button) */}
              <div className={cn('shrink-0', onShowDetails && 'pr-7')}>
                {full ? (
                  <Lock className="size-3.5 text-[#B0AAA0]" aria-hidden />
                ) : (
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border transition-colors',
                      selected
                        ? 'border-white bg-white'
                        : 'border-[#D8D3CC] bg-transparent',
                    )}
                  >
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 28,
                          }}
                        >
                          <Check
                            className="size-3 text-[#0F1F2E]"
                            aria-hidden
                          />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                )}
              </div>
            </button>

            {/* Info button — sibling so it isn't a nested <button> */}
            {onShowDetails && (
              <button
                type="button"
                aria-label={`View details for ${room.suiteLabel}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails(room.id);
                }}
                className={cn(
                  'absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors',
                  selected && !full
                    ? 'text-white/70 hover:bg-white/10 hover:text-white'
                    : 'text-[#B0AAA0] hover:bg-[#0F1F2E]/5 hover:text-[#5C534A]',
                )}
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
