'use client';

import { motion } from 'motion/react';
import { BedDouble, Bath, DoorOpen, Sparkles, Users } from 'lucide-react';
import { Drawer, DrawerContent } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';
import {
  AMENITY_LABELS,
  BED_LABELS,
  type Bed,
  type RoomAmenity,
  type RoomWithAvailability,
} from '@repo/api-types';

type RoomDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  room: RoomWithAvailability | null;
};

function bedSummary(beds: Bed[]): string {
  return beds
    .map((b) => {
      const label = BED_LABELS[b.type] ?? b.type;
      return b.count > 1 ? `${b.count} ${label}s` : `1 ${label}`;
    })
    .join(' · ');
}

export function RoomDetailSheet({ open, onClose, room }: RoomDetailSheetProps) {
  if (!room) return null;

  const beds = (room.beds ?? []) as Bed[];
  const amenities = (room.amenities ?? []) as RoomAmenity[];
  const filled = room.assignedGuests.length;
  const totalBeds = beds.reduce((sum, b) => sum + b.count, 0);

  return (
    <Drawer open={open} onOpenChange={onClose}>
      {/* overflow-hidden so the photograph is clipped by the rounded top
          rather than leaving a white cap above it — the band read as a gap
          rather than as a choice. */}
      <DrawerContent
        className={cn(
          'flex max-h-[90vh] flex-col overflow-hidden rounded-t-[20px] bg-white',
          // The drawer's grab handle is an in-flow child (mt-4 h-1), so the
          // photograph began 20px down behind a white band the width of the
          // sheet. Lifting the handle out of flow lets the image start at the
          // rounded edge, and the tint keeps the handle readable on top of it.
          room.imageUrl &&
            '[&>div:first-child]:absolute [&>div:first-child]:left-1/2 [&>div:first-child]:z-10 [&>div:first-child]:-translate-x-1/2 [&>div:first-child]:bg-white/70',
        )}
      >
        {/* Inner scroll region — keeps the sheet from clipping its last rows
            when opened as a nested drawer over the manifest. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10">
          {/* Hero image */}
          {room.imageUrl ? (
            <div className="relative mb-5 h-[260px] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={room.imageUrl}
                alt={room.name}
                className="size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ) : (
            <div className="pt-6" />
          )}

          <div className="px-5">
            {/* Header */}
            <div className="mb-5">
              <p className="text-[8px] font-semibold uppercase tracking-[3px] text-[#9A9288]">
                Room {room.number}
                {room.floorLevel ? ` · Floor ${room.floorLevel}` : ''}
              </p>
              <h2 className="mt-1 font-cormorant text-[26px] font-medium italic leading-tight text-[#2B2824]">
                {room.name}
              </h2>
              {room.description && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#797168]">
                  {room.description}
                </p>
              )}
            </div>

            {/* Quick stats */}
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <StatTile
                icon={<BedDouble className="size-4" aria-hidden />}
                value={`${totalBeds}`}
                label={totalBeds === 1 ? 'Bed' : 'Beds'}
              />
              <StatTile
                icon={<Bath className="size-4" aria-hidden />}
                value={`${room.bathrooms}`}
                label={room.bathrooms === 1 ? 'Bath' : 'Baths'}
              />
              <StatTile
                icon={<Users className="size-4" aria-hidden />}
                value={`${room.capacity}`}
                label="Sleeps"
              />
            </div>

            {/* Beds breakdown */}
            <Section title="Sleeping arrangements">
              <div className="flex flex-col gap-1.5">
                {beds.length > 0 ? (
                  beds.map((b, i) => (
                    <div
                      key={`${b.type}-${i}`}
                      className="flex items-center gap-2.5 rounded-[10px] border border-[#EDEAE4] bg-[#FAF9F7] px-3 py-2"
                    >
                      <BedDouble
                        className="size-3.5 shrink-0 text-[#5C534A]"
                        aria-hidden
                      />
                      <span className="text-[11px] text-[#2B2824]">
                        {b.count > 1
                          ? `${b.count} × ${BED_LABELS[b.type] ?? b.type}`
                          : (BED_LABELS[b.type] ?? b.type)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-[#9A9288]">{room.bedConfig}</p>
                )}
              </div>
            </Section>

            {/* Bathroom */}
            <Section title="Bathroom">
              <div className="flex items-center gap-2 text-[11px] text-[#2B2824]">
                <Bath className="size-3.5 text-[#5C534A]" aria-hidden />
                {room.bathrooms}{' '}
                {room.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                {room.ensuite && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[9px] font-medium text-[#2F5510]">
                    <DoorOpen className="size-2.5" aria-hidden />
                    Ensuite
                  </span>
                )}
              </div>
            </Section>

            {/* Amenities */}
            {amenities.length > 0 && (
              <Section title="Amenities">
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E3E0DA] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5C534A]"
                    >
                      <Sparkles
                        className="size-2.5 text-[#9A9288]"
                        aria-hidden
                      />
                      {AMENITY_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Occupancy */}
            <Section title="Occupancy">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[10px] text-[#797168]">
                  {filled} of {room.capacity} assigned
                </span>
                {room.availableCapacity > 0 ? (
                  <span className="text-[10px] font-medium text-[#3A5E48]">
                    {room.availableCapacity} spot
                    {room.availableCapacity === 1 ? '' : 's'} left
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[#854F0B]">
                    Full
                  </span>
                )}
              </div>
              {filled > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {room.assignedGuests.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE7E2] px-2 py-1"
                    >
                      <span className="flex size-[15px] items-center justify-center rounded-full bg-[#0F1F2E] text-[7px] font-bold text-white">
                        {`${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`.toUpperCase()}
                      </span>
                      <span className="text-[9.5px] font-medium text-[#2B2824]">
                        {g.firstName}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] italic text-[#B0AAA0]">
                  No guests assigned yet
                </p>
              )}
            </Section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-1 rounded-[12px] border border-[#EDEAE4] bg-[#FAF9F7] py-3"
    >
      <span className="text-[#5C534A]">{icon}</span>
      <span className="font-cormorant text-[18px] italic leading-none text-[#2B2824]">
        {value}
      </span>
      <span className="text-[7.5px] font-semibold uppercase tracking-[1.5px] text-[#9A9288]">
        {label}
      </span>
    </motion.div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[8px] font-semibold uppercase tracking-[2.5px] text-[#9A9288]">
        {title}
      </p>
      {children}
    </div>
  );
}

export { bedSummary };
