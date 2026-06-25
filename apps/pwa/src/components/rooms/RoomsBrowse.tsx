'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, BedDouble, Bath, Users, DoorOpen } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';
import { RoomDetailSheet } from '@/components/manifest/RoomDetailSheet';
import {
  AMENITY_LABELS,
  type Bed,
  type RoomAmenity,
  type RoomWithAvailability,
} from '@repo/api-types';

function totalBedCount(beds: Bed[] | undefined, fallback: number): number {
  if (!beds?.length) return fallback;
  return beds.reduce((sum, b) => sum + b.count, 0);
}

export const RoomsBrowse = () => {
  const router = useRouter();
  const { data: rooms, isLoading } = useRoomAvailability();
  const [detailRoom, setDetailRoom] = useState<RoomWithAvailability | null>(
    null,
  );

  return (
    <div className="flex flex-col pb-12">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[2px] text-[#797168]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </button>
        <h1 className="font-cormorant text-[22px] italic text-[#2B2824]">
          The Rooms
        </h1>
        <span className="w-9" />
      </div>

      <p className="mb-5 text-[11px] leading-relaxed text-[#797168]">
        Explore each room&apos;s layout, beds and amenities to decide where your
        guests will stay.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[16px] bg-[#E8E5E0]"
            />
          ))}
        </div>
      ) : (rooms?.length ?? 0) === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#C9C4BC] bg-[#F7F5F2] px-4 py-10 text-center">
          <p className="text-[11px] text-[#797168]">
            No rooms available to display yet.
          </p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          {(rooms ?? []).map((room) => {
            const beds = (room.beds ?? []) as Bed[];
            const amenities = (room.amenities ?? []) as RoomAmenity[];
            const totalBeds = totalBedCount(beds, room.capacity);
            const filled = room.assignedGuests.length;

            return (
              <motion.button
                key={room.number}
                type="button"
                onClick={() => setDetailRoom(room)}
                whileTap={{ scale: 0.99 }}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, ease: 'easeOut' },
                  },
                }}
                className="group overflow-hidden rounded-[16px] border border-[#E3E0DA] bg-white text-left shadow-[0_1px_6px_rgba(15,31,46,0.06)]"
              >
                {/* Photo */}
                {room.imageUrl && (
                  <div className="relative h-40 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between">
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[2.5px] text-white/70">
                          Room {room.number}
                          {room.floorLevel ? ` · Floor ${room.floorLevel}` : ''}
                        </p>
                        <h2 className="font-cormorant text-[20px] italic leading-tight text-white">
                          {room.name}
                        </h2>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[9px] font-semibold',
                          room.availableCapacity > 0
                            ? 'bg-white/90 text-[#1A6B3C]'
                            : 'bg-[#854F0B] text-white',
                        )}
                      >
                        {room.availableCapacity > 0
                          ? `${room.availableCapacity} free`
                          : 'Full'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 p-4">
                  {/* Title fallback when no image */}
                  {!room.imageUrl && (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[2.5px] text-[#9A9288]">
                          Room {room.number}
                        </p>
                        <h2 className="font-cormorant text-[20px] italic leading-tight text-[#2B2824]">
                          {room.name}
                        </h2>
                      </div>
                    </div>
                  )}

                  {/* Stat row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#2B2824]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#9A9288]" aria-hidden />
                      Sleeps {room.capacity}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble
                        className="size-3.5 text-[#9A9288]"
                        aria-hidden
                      />
                      {totalBeds} bed{totalBeds === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="size-3.5 text-[#9A9288]" aria-hidden />
                      {room.bathrooms} bath{room.bathrooms === 1 ? '' : 's'}
                    </span>
                    {room.ensuite && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#1A6B3C]">
                        <DoorOpen className="size-3" aria-hidden />
                        Ensuite
                      </span>
                    )}
                  </div>

                  {room.description && (
                    <p className="line-clamp-2 text-[10.5px] leading-relaxed text-[#797168]">
                      {room.description}
                    </p>
                  )}

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-[#E3E0DA] bg-[#FAF9F7] px-2 py-0.5 text-[9px] font-medium text-[#5C534A]"
                        >
                          {AMENITY_LABELS[a] ?? a}
                        </span>
                      ))}
                      {amenities.length > 4 && (
                        <span className="rounded-full border border-[#E3E0DA] bg-[#FAF9F7] px-2 py-0.5 text-[9px] font-medium text-[#5C534A]">
                          +{amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Occupancy footer */}
                  <div className="flex items-center justify-between border-t border-[#EDEAE4] pt-2.5">
                    <span className="text-[9px] uppercase tracking-[1.5px] text-[#9A9288]">
                      {filled} of {room.capacity} assigned
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[1.5px] text-[#0F1F2E] transition-colors group-hover:text-[#1A3040]">
                      View details ›
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <RoomDetailSheet
        open={!!detailRoom}
        onClose={() => setDetailRoom(null)}
        room={detailRoom}
      />
    </div>
  );
};
