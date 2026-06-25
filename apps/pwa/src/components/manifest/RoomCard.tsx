'use client';

import { motion, AnimatePresence } from 'motion/react';
import { BedDouble, Bath, ChevronRight } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { Bed, RoomWithAvailability } from '@repo/api-types';

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export const RoomCard = ({
  room,
  locked,
  onShowDetails,
}: {
  room: RoomWithAvailability;
  locked: boolean;
  onShowDetails?: () => void;
}) => {
  const filled = room.assignedGuests.length;
  const isEmpty = filled === 0;
  const pct = room.capacity > 0 ? (filled / room.capacity) * 100 : 0;
  const beds = (room.beds ?? []) as Bed[];
  const totalBeds = beds.reduce((sum, b) => sum + b.count, 0);

  return (
    <motion.button
      type="button"
      layout
      onClick={onShowDetails}
      whileTap={{ scale: 0.98 }}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
      }}
      className={cn(
        'group rounded-[14px] border p-3 flex flex-col gap-2.5 overflow-hidden text-left transition-colors',
        isEmpty
          ? 'border-dashed border-[#C9C4BC] bg-[#F7F5F2] hover:border-[#B0AAA0]'
          : 'border border-[#E3E0DA] bg-white shadow-[0_1px_4px_rgba(15,31,46,0.06)] hover:border-[#C9C4BC]',
      )}
    >
      {/* Room image */}
      {room.imageUrl && (
        <div className="-mx-3 -mt-3 mb-0.5 h-20 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={room.imageUrl}
            alt={room.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Room label + capacity dots */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[7.5px] font-semibold uppercase tracking-[2.5px] text-[#9A9288]">
            Room {room.number}
          </p>
          <p className="text-[11px] font-medium text-[#2B2824] leading-snug mt-0.5 truncate">
            {room.name}
          </p>
          {/* Inline bed/bath summary */}
          <div className="mt-1 flex items-center gap-2 text-[8.5px] text-[#9A9288]">
            <span className="inline-flex items-center gap-0.5">
              <BedDouble className="size-2.5" aria-hidden />
              {totalBeds || room.capacity}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Bath className="size-2.5" aria-hidden />
              {room.bathrooms}
            </span>
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex flex-wrap justify-end gap-[3px] mt-0.5 max-w-[36px] shrink-0">
          {Array.from({ length: room.capacity }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                backgroundColor: i < filled ? '#0F1F2E' : '#DDD9D3',
                scale: i < filled ? 1 : 0.82,
              }}
              transition={{ duration: 0.28, delay: i * 0.04 }}
              className="size-[6px] rounded-full inline-block"
            />
          ))}
        </div>
      </div>

      {/* Thin capacity bar */}
      <div className="h-[2px] rounded-full bg-[#E3E0DA] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#0F1F2E]"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      </div>

      {/* Guest pills */}
      <div className="flex flex-wrap gap-1 min-h-[20px] items-start">
        <AnimatePresence mode="popLayout">
          {isEmpty ? (
            <motion.span
              key="empty-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[8.5px] text-[#B0AAA0] italic leading-tight"
            >
              Empty · Available
            </motion.span>
          ) : (
            room.assignedGuests.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.65 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.65 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="flex items-center gap-[4px] rounded-full bg-[#EAE7E2] px-[6px] py-[2px]"
              >
                <span className="flex items-center justify-center size-[13px] rounded-full bg-[#0F1F2E] text-[6.5px] font-bold text-white shrink-0">
                  {initials(g.firstName, g.lastName)}
                </span>
                <span className="text-[8.5px] font-medium text-[#2B2824] leading-none">
                  {g.firstName}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Full badge */}
      {!isEmpty && filled >= room.capacity && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[7.5px] font-semibold uppercase tracking-[1.5px] text-[#854F0B] bg-[#FAEEDA] border border-[#854F0B]/25 rounded-full px-2 py-0.5 w-fit"
        >
          Full
        </motion.div>
      )}

      {/* Tap-for-details affordance */}
      <div className="mt-auto flex items-center justify-between border-t border-[#EDEAE4] pt-2">
        <span className="text-[7px] font-semibold uppercase tracking-[1.5px] text-[#B0AAA0] transition-colors group-hover:text-[#797168]">
          Tap for details
        </span>
        <ChevronRight
          className="size-3 text-[#B0AAA0] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </motion.button>
  );
};
