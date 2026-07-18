'use client';

import { useState } from 'react';
import { BedDouble, Bath, Pencil, Plus, DoorOpen } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { AMENITY_LABELS, type Bed, type Room } from '@repo/api-types';
import { RoomFormDialog } from '@/components/manager/pages/rooms/RoomFormDialog';

function bedCount(beds: Bed[] | undefined, fallback: number): number {
  if (!beds?.length) return fallback;
  return beds.reduce((sum, b) => sum + b.count, 0);
}

export const RoomsPage = () => {
  const { data: rooms, isLoading } = useRooms();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const openCreate = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  return (
    <div className="font-inter space-y-6">
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(rooms ?? []).map((room) => {
            const beds = (room.beds ?? []) as Bed[];
            const totalBeds = bedCount(beds, room.capacity);
            const amenities = room.amenities ?? [];

            return (
              <div
                key={room.number}
                className={cn(
                  'flex flex-col overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(26,22,20,0.04)] transition-colors',
                  room.isActive
                    ? 'border-manager-border'
                    : 'border-dashed border-[#d4d0c8] opacity-70',
                )}
              >
                {/* Image */}
                {room.imageUrl && (
                  <div className="h-36 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="size-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-manager-text-muted">
                        Room {room.number}
                        {room.floorLevel ? ` · Floor ${room.floorLevel}` : ''}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-manager-text">
                        {room.name}
                      </h3>
                    </div>
                    {!room.isActive && (
                      <span className="rounded-full bg-[#f1efea] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-manager-text-muted">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-manager-text">
                    <span className="inline-flex items-center gap-1.5">
                      <BedDouble className="size-4 text-manager-text-muted" />
                      {totalBeds} bed{totalBeds === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="size-4 text-manager-text-muted" />
                      {room.bathrooms} bath{room.bathrooms === 1 ? '' : 's'}
                    </span>
                    {room.ensuite && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <DoorOpen className="size-3.5" />
                        Ensuite
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-manager-text-muted">
                    {room.bedConfig}
                  </p>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-manager-border bg-[#faf9f7] px-2 py-0.5 text-[10px] font-medium text-manager-text-muted"
                        >
                          {AMENITY_LABELS[a] ?? a}
                        </span>
                      ))}
                      {amenities.length > 4 && (
                        <span className="rounded-full border border-manager-border bg-[#faf9f7] px-2 py-0.5 text-[10px] font-medium text-manager-text-muted">
                          +{amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => openEdit(room)}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-manager-border bg-white px-3 py-1.5 text-xs font-medium text-manager-text transition-colors hover:border-manager-accent/40 hover:bg-[#faf9f7]"
                  >
                    <Pencil className="size-3.5" />
                    Edit room
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add room card */}
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-[208px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d4d0c8] bg-white p-8 text-center shadow-[0_1px_3px_rgba(26,22,20,0.04)] transition-colors hover:border-manager-accent/40 hover:bg-[#faf9f7]"
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-[#e5e0d8] bg-[#f7f5f2]">
              <Plus
                className="size-6 text-manager-text-muted"
                strokeWidth={1.5}
              />
            </span>
            <p className="mt-4 text-sm font-medium text-manager-text">
              Add new room
            </p>
          </button>
        </div>
      )}

      <RoomFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        room={editingRoom}
      />
    </div>
  );
};
