'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Check, X, Star, ChevronRight } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/button';
import { useUpdatePrimaryDetails } from '@/hooks/useManifest';
import { DIETARY_VALUES } from '@/components/GuestManifestForm/schema';
import { RoomPicker } from '@/components/GuestManifestForm/RoomPicker';
import { type RoomOption } from '@/components/GuestManifestForm/rooms';
import type { ManifestResponse, RoomWithAvailability } from '@repo/api-types';

type Primary = ManifestResponse['primaryGuest'];

function dietaryLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function PrimaryDetailsCard({
  primary,
  rooms,
  isPrimary,
  isEditing,
  onEditingChange,
}: {
  primary: Primary;
  rooms: RoomWithAvailability[];
  isPrimary: boolean;
  isEditing: boolean;
  onEditingChange: (open: boolean) => void;
}) {
  // Same shape the guest manifest form feeds its RoomPicker.
  const roomOptions: RoomOption[] = rooms.map((r) => ({
    id: r.number.toString(),
    name: `Room ${r.number}`,
    suiteLabel: r.name,
    filled: r.capacity - r.availableCapacity,
    capacity: r.capacity,
    bedConfig: r.bedConfig,
    totalBeds: (r.beds ?? []).reduce((sum, b) => sum + b.count, 0),
    bathrooms: r.bathrooms,
  }));

  // The room is what `primaryComplete` turns on and what holds up submission,
  // so it is the one thing this card has to ask for out loud.
  const needsRoom = primary.roomNumber == null;
  const outstanding = isPrimary && needsRoom;

  const roomName = primary.roomNumber
    ? (rooms.find((r) => r.number === primary.roomNumber)?.name ??
      `Room ${primary.roomNumber}`)
    : null;

  const openEditor = () => onEditingChange(true);

  const dietaryTags = (primary.dietaryRestrictions ?? []).map((d) => ({
    label: dietaryLabel(d),
    bg: 'bg-[#EEF5F0]',
    border: 'border-[#3A5E48]/25',
    color: 'text-[#3A5E48]',
  }));
  const allergyTag = primary.allergies
    ? [
        {
          label: primary.allergies,
          bg: 'bg-[#FEF6F4]',
          border: 'border-[#B42318]/25',
          color: 'text-[#B42318]',
        },
      ]
    : [];
  const tags = [...dietaryTags, ...allergyTag];

  return (
    <div
      className={cn(
        'rounded-[14px] border px-4 py-3.5 flex flex-col gap-2.5 shadow-[0_1px_3px_rgba(15,31,46,0.05)]',
        outstanding && !isEditing
          ? 'border-[#D9C79A] bg-[#FDF9EF]'
          : 'border-[#0F1F2E]/15 bg-[#FBFAF8]',
      )}
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-[30px] rounded-full bg-[#C7A046] text-[11px] font-bold text-white shrink-0">
            <Star className="size-3.5" fill="currentColor" aria-hidden />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#2B2824] leading-none">
              {primary.firstName} {primary.lastName}
            </p>
            <p className="text-[9px] uppercase tracking-[1.5px] text-[#B08A2E] mt-0.5">
              You · Primary guest
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && roomName && (
            <span className="text-[8.5px] font-medium text-[#2B2824] bg-[#F0EDE6] border border-[#E3E0DA] rounded-full px-2.5 py-1 leading-none">
              {roomName}
            </span>
          )}
          {isPrimary && !isEditing && (
            <button
              onClick={openEditor}
              aria-label="Edit your details"
              className="flex items-center justify-center size-7 rounded-full border border-[#E3E0DA] bg-white text-[#797168] hover:bg-[#F5F3F0] transition-colors"
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Display mode ─────────────────────────────────────────── */}
      {!isEditing && (
        <>
          {primary.email && (
            <p className="text-[10px] text-[#797168] truncate">
              {primary.email}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[8.5px] font-medium capitalize',
                    t.bg,
                    t.border,
                    t.color,
                  )}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
          {primary.beveragePreferences && (
            <p className="text-[9.5px] text-[#797168] border-t border-[#F0EDE6] pt-2">
              <span className="font-medium text-[#2B2824]">Beverages: </span>
              {primary.beveragePreferences}
            </p>
          )}
          {outstanding && (
            <button
              onClick={openEditor}
              className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#D9C79A] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#FDFBF6]"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-[#8A6D17]">
                  Room and details still to add
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-[#9A8B62]">
                  Choose your room, and anything the kitchen should know.
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-[#B08A2E]"
                aria-hidden
              />
            </button>
          )}
        </>
      )}

      {/* ─── Edit mode ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isEditing && (
          <PrimaryEditor
            primary={primary}
            roomOptions={roomOptions}
            onDone={() => onEditingChange(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PrimaryEditor({
  primary,
  roomOptions,
  onDone,
}: {
  primary: Primary;
  roomOptions: RoomOption[];
  onDone: () => void;
}) {
  const updateDetails = useUpdatePrimaryDetails();

  // Seeded once, on mount. The card unmounts this on close, so an abandoned
  // half-typed change never comes back looking like it was saved.
  const [roomId, setRoomId] = useState(primary.roomNumber?.toString() ?? '');
  const [dietary, setDietary] = useState<string[]>(
    primary.dietaryRestrictions ?? [],
  );
  const [allergies, setAllergies] = useState(primary.allergies ?? '');
  const [beverages, setBeverages] = useState(primary.beveragePreferences ?? '');

  const toggleDietary = (value: string) =>
    setDietary((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const handleSave = async () => {
    await updateDetails.mutateAsync({
      roomNumber: roomId ? parseInt(roomId, 10) : null,
      dietaryRestrictions: dietary,
      allergies: allergies.trim() || null,
      beveragePreferences: beverages.trim() || null,
    });
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 border-t border-[#F0EDE6] pt-3">
        {/* Room — same picker guests use, for a consistent experience */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] uppercase tracking-[2px] text-[#9A9288]">
            Your room
          </label>
          {roomOptions.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-[#D8D3C9] bg-[#F7F5F2] px-3 py-3 text-[10px] text-[#797168]">
              Rooms haven&apos;t been configured yet.
            </p>
          ) : (
            <RoomPicker
              rooms={roomOptions}
              value={roomId}
              onChange={setRoomId}
            />
          )}
        </div>

        {/* Dietary */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] uppercase tracking-[2px] text-[#9A9288]">
            Dietary preferences
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_VALUES.filter((v) => v !== 'other').map((value) => {
              const active = dietary.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDietary(value)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[9px] font-medium capitalize transition-colors',
                    active
                      ? 'border-[#3A5E48] bg-[#EEF5F0] text-[#3A5E48]'
                      : 'border-[#E3E0DA] bg-white text-[#797168]',
                  )}
                >
                  {dietaryLabel(value)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergies */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] uppercase tracking-[2px] text-[#9A9288]">
            Allergies
          </label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Severe peanut allergy"
            className="h-10 rounded-[10px] border border-[#E3E0DA] bg-white px-3 text-[12px] text-[#2B2824] outline-none placeholder:text-[#B0AAA0] focus:border-[#0F1F2E]"
          />
        </div>

        {/* Beverages */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] uppercase tracking-[2px] text-[#9A9288]">
            Beverage preferences
          </label>
          <input
            value={beverages}
            onChange={(e) => setBeverages(e.target.value)}
            placeholder="e.g. Still water, no alcohol"
            className="h-10 rounded-[10px] border border-[#E3E0DA] bg-white px-3 text-[12px] text-[#2B2824] outline-none placeholder:text-[#B0AAA0] focus:border-[#0F1F2E]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={updateDetails.isPending}
            className="flex-1 h-10 rounded-[10px] bg-[#0F1F2E] text-white text-[10px] font-semibold uppercase tracking-[1.5px] gap-1.5 hover:bg-[#1A3040] disabled:opacity-60"
          >
            <Check className="size-3.5" aria-hidden />
            {updateDetails.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            onClick={onDone}
            variant="outline"
            disabled={updateDetails.isPending}
            className="h-10 rounded-[10px] border-[#E3E0DA] bg-white text-[#797168] text-[10px] font-semibold uppercase tracking-[1.5px] gap-1.5"
          >
            <X className="size-3.5" aria-hidden />
            Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
