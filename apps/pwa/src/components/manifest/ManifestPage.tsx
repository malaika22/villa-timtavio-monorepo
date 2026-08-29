'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Pencil,
  Check,
  Star,
  Clock,
  Users,
} from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { cn } from '@repo/ui/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  useManifest,
  useAddManifestGuest,
  useUpdateManifestGuest,
  useRemoveManifestGuest,
  useSubmitManifest,
} from '@/hooks/useManifest';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';
import { useStickyBar } from '@/store/useStickyBar';
import { useAuth } from '@/hooks/useAuth';
import { GuestManifestForm } from '@/components/GuestManifestForm';
import type { GuestManifestFormValues } from '@/components/GuestManifestForm';
import { GuestAddedSheet } from './GuestAddedSheet';
import { YourDetailsSheet } from './YourDetailsSheet';
import { PrimaryDetailsCard } from './PrimaryDetailsCard';
import { stayDateShort } from '@/lib/stay-date';
import type {
  CreateManifestGuestDto,
  ManifestGuest,
  RoomWithAvailability,
} from '@repo/api-types';
import type {
  DietaryValue,
  RelationshipValue,
} from '@/components/GuestManifestForm/schema';

// ─── DTO helpers ──────────────────────────────────────────────────────────────

function mapFormToDto(data: GuestManifestFormValues): CreateManifestGuestDto {
  const parts = data.fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: (parts.slice(1).join(' ') || parts[0]) ?? '',
    email: data.email,
    phone: data.phone || undefined,
    dateOfBirth: data.dateOfBirth || undefined,
    relationship: data.relationship,
    roomNumber: data.roomId ? parseInt(data.roomId, 10) : undefined,
    dietaryRestrictions: data.dietaryRestrictions,
    dietaryOtherDetails: data.dietaryRestrictions.includes('other')
      ? data.dietaryOtherDetails || undefined
      : undefined,
    allergies: data.foodAllergies || undefined,
    beveragePreferences: data.beveragePreferences || undefined,
    specialNotes: data.specialNotes || undefined,
  };
}

function mapGuestToFormValues(guest: ManifestGuest): GuestManifestFormValues {
  return {
    __step: 1,
    fullName: `${guest.firstName} ${guest.lastName}`.trim(),
    email: guest.email,
    phone: guest.phone ?? '',
    relationship: (guest.relationship as RelationshipValue) ?? 'family',
    dateOfBirth: guest.dateOfBirth ?? '',
    roomId: guest.roomNumber?.toString() ?? '',
    dietaryRestrictions: (guest.dietaryRestrictions ?? []) as DietaryValue[],
    dietaryOtherDetails: guest.dietaryOtherDetails ?? '',
    foodAllergies: guest.allergies ?? '',
    beveragePreferences: guest.beveragePreferences ?? '',
    specialNotes: guest.specialNotes ?? '',
  };
}

// ─── Status chip meta ─────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; dot: string; ring: string; text: string }
> = {
  INCOMPLETE: {
    label: 'Not started',
    dot: 'bg-[#9A9288]',
    ring: 'border-[#9A9288]/30 bg-[#9A9288]/10',
    text: 'text-[#797168]',
  },
  IN_PROGRESS: {
    label: 'In progress',
    dot: 'bg-[#C7A046]',
    ring: 'border-[#C7A046]/30 bg-[#C7A046]/10',
    text: 'text-[#8B6914]',
  },
  SUBMITTED: {
    label: 'Submitted',
    dot: 'bg-[#3A5E48]',
    ring: 'border-[#3A5E48]/30 bg-[#3A5E48]/10',
    text: 'text-[#3A5E48]',
  },
  APPROVED: {
    label: 'Approved',
    dot: 'bg-[#1A6B3C]',
    ring: 'border-[#1A6B3C]/30 bg-[#1A6B3C]/10',
    text: 'text-[#1A6B3C]',
  },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export const ManifestPage = () => {
  const router = useRouter();
  const { bookingId, isPrimary, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: manifest, isLoading: manifestLoading } = useManifest();
  const { data: rooms, isLoading: roomsLoading } = useRoomAvailability();
  const addGuest = useAddManifestGuest();
  const updateGuest = useUpdateManifestGuest();
  const removeGuest = useRemoveManifestGuest();
  const submitManifest = useSubmitManifest();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<ManifestGuest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedGuestName, setAddedGuestName] = useState('');
  const [showAddedSheet, setShowAddedSheet] = useState(false);
  const [showOwnDetails, setShowOwnDetails] = useState(false);
  const [editingPrimary, setEditingPrimary] = useState(false);
  const primaryCardRef = useRef<HTMLDivElement>(null);

  // Tells the install pill how far to step up so it stops covering the bar.
  const actionBarRef = useRef<HTMLDivElement>(null);
  const setStickyBarHeight = useStickyBar((st) => st.setHeight);
  const stickyBarHeight = useStickyBar((st) => st.height);
  useEffect(() => {
    const el = actionBarRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setStickyBarHeight(entry?.contentRect.height ?? 0),
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      setStickyBarHeight(0);
    };
  }, [setStickyBarHeight]);

  // Opened from the action bar, the editor is off screen — expanding it where
  // nobody is looking reads as the button having done nothing.
  const openPrimaryEditor = () => {
    setEditingPrimary(true);
    requestAnimationFrame(() =>
      primaryCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      }),
    );
  };

  // A secondary guest's own row. The manifest is unique on (booking, email),
  // so their token's email is enough to find it.
  const ownRecord =
    !isPrimary && user?.email
      ? (manifest?.guests?.find(
          (g) => g.email.toLowerCase() === user.email.toLowerCase(),
        ) ?? null)
      : null;

  const isLoading = manifestLoading || roomsLoading;
  const status = manifest?.manifestStatus ?? 'INCOMPLETE';
  // Submitting no longer freezes the list. It used to, and the copy told the
  // party to telephone the estate for any change — which is what a group of
  // eight does constantly, so the lock only ever converted an edit into a phone
  // call. Submission now means "the estate can act on this", and the guest list
  // stays open until they leave.
  const isSubmitted = status === 'SUBMITTED' || status === 'APPROVED';
  const meta = STATUS_META[status] ?? STATUS_META.INCOMPLETE!;

  const addedGuests = manifest?.addedGuests ?? 0;
  const totalGuests = manifest?.totalGuests ?? 0;
  const pct =
    totalGuests > 0
      ? Math.min(100, Math.round((addedGuests / totalGuests) * 100))
      : 0;

  // Only the primary member can manage the manifest (add/edit/submit); the
  // backend enforces this too, so we hide the controls for secondary guests.
  //
  // Their own room is part of it. The primary isn't a row in this list, so
  // nothing here was ever checking them — they could add the party, submit,
  // and leave the estate to find out at check-in that the person paying had
  // nowhere to sleep. The API refuses it now; this stops them reaching that
  // refusal in the first place.
  const primaryComplete = manifest?.primaryComplete ?? true;
  const canSubmit = isPrimary && addedGuests > 0 && primaryComplete;
  // The party counter includes the primary (+1), so it's full once the added
  // count reaches the reservation headcount — stop offering "Add guest" then.
  const secondaryCount = manifest?.guests?.length ?? 0;
  const partyFull = totalGuests > 0 && addedGuests >= totalGuests;

  const openAddForm = () => {
    setEditingGuest(null);
    setIsAddOpen(true);
  };

  const openEditForm = (guest: ManifestGuest) => {
    setEditingGuest(guest);
    setIsAddOpen(true);
  };

  const handleSave = async (data: GuestManifestFormValues) => {
    const dto = mapFormToDto(data);

    if (editingGuest) {
      await updateGuest.mutateAsync({ guestId: editingGuest.id, dto });
      setEditingGuest(null);
      setIsAddOpen(false);
    } else {
      await addGuest.mutateAsync(dto);
      void queryClient.invalidateQueries({
        queryKey: ['rooms', 'availability', bookingId],
      });
      setAddedGuestName(dto.firstName);
      setIsAddOpen(false);
      setShowAddedSheet(true);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitManifest.mutateAsync();
      router.push('/guest-submitted');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not submit the guest list.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col"
      // The bar is fixed 72px up (clearing the footer), so the page has to
      // clear both. It was a flat pb-52 — 208px — which left a half-screen of
      // nothing under a short list and still guessed wrong when the bar
      // carried two rows. We already measure the bar for the install pill.
      style={{ paddingBottom: 72 + stickyBarHeight + 16 }}
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[2px] text-[#797168]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </button>
        <h1 className="font-cormorant italic text-[22px] text-[#2B2824]">
          Guest Manifest
        </h1>
        {manifestLoading ? (
          // "Not started" is a claim, and it was being made before the answer
          // arrived — a returning guest saw their finished manifest labelled
          // untouched for as long as the request took.
          <div className="skeleton h-[22px] w-[86px] rounded-full bg-[#E3E0DA]" />
        ) : (
          <motion.div
            layout
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[1px]',
              meta.ring,
              meta.text,
            )}
          >
            <span
              className={cn('size-[4px] shrink-0 rounded-full', meta.dot)}
            />
            {meta.label}
          </motion.div>
        )}
      </div>

      {/* ─── Stats row ──────────────────────────────────────────── */}
      <div className="mb-5 space-y-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[8px] uppercase tracking-[3px] text-[#797168]">
            Guests added
          </span>
          {manifestLoading ? (
            <div className="h-5 w-16 skeleton rounded bg-[#E3E0DA]" />
          ) : (
            <motion.span
              key={addedGuests}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="font-cormorant text-[22px] italic text-[#2B2824] leading-none"
            >
              {addedGuests}
              <span className="text-[#B0AAA0] text-[16px]">
                {' '}
                / {totalGuests}
              </span>
            </motion.span>
          )}
        </div>
        {manifestLoading ? (
          <div className="h-[3px] w-full skeleton rounded-full bg-[#E3E0DA]" />
        ) : (
          <Progress value={pct} className="h-[3px] rounded-full bg-[#E3E0DA]" />
        )}
      </div>

      {/* ─── Submitted banner — a receipt, not a lock ──────────── */}
      {isSubmitted &&
        (status === 'APPROVED' ? (
          <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-[#3A5E48]/30 bg-[#EAF3E8] px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3A5E48]">
              <Check
                className="size-4 text-white"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#2F4A3A]">
                The estate has your guest list
              </p>
              <p className="text-[10px] leading-snug text-[#5E6B5C]">
                Everyone has their access. You can still make changes.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-[#854F0B]/30 bg-[#FAEEDA] px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#BA7517]">
              <Clock
                className="size-4 text-white"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#7A4A0B]">
                Sent to the estate
              </p>
              <p className="text-[10px] leading-snug text-[#8A6A2F]">
                They&apos;ll take it from here. Change anything you need to —
                your party each keep their own details up to date.
              </p>
            </div>
          </div>
        ))}

      {/* ─── Room availability (compact) ────────────────────────── */}
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
          Room availability
        </p>
        <Link
          href="/rooms"
          className="flex items-center gap-1 text-[8px] font-medium uppercase tracking-[2px] text-[#0F1F2E]"
        >
          View rooms
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="h-[52px] skeleton rounded-[12px] bg-[#E8E5E0]" />
      ) : (rooms?.length ?? 0) === 0 ? (
        <Link
          href="/rooms"
          className="block rounded-[12px] border border-dashed border-[#C9C4BC] bg-[#F7F5F2] px-4 py-4 text-center text-[10px] text-[#797168]"
        >
          View room details
        </Link>
      ) : (
        <Link
          href="/rooms"
          className="flex flex-wrap gap-1.5 rounded-[12px] border border-[#E3E0DA] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,31,46,0.04)]"
        >
          {(rooms ?? []).map((room) => {
            const filled = room.assignedGuests.length;
            const full = filled >= room.capacity;
            return (
              <span
                key={room.number}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1',
                  full
                    ? 'border-[#854F0B]/25 bg-[#FAEEDA]'
                    : 'border-[#E3E0DA] bg-[#FAF9F7]',
                )}
              >
                <span className="text-[9px] font-semibold text-[#2B2824]">
                  R{room.number}
                </span>
                <span className="flex gap-[2px]">
                  {Array.from({ length: room.capacity }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'size-[5px] rounded-full',
                        i < filled ? 'bg-[#0F1F2E]' : 'bg-[#DDD9D3]',
                      )}
                    />
                  ))}
                </span>
              </span>
            );
          })}
        </Link>
      )}

      {/* Loading stood the page down to two grey slivers and a void: the
          primary's card and the whole list are keyed off data that isn't
          there yet, so nothing rendered between the progress bar and the
          room pips. Standing in for both keeps the shape of the page while
          it arrives, and stops everything below jumping when it does. */}
      {manifestLoading && (
        <div className="mt-6" aria-busy="true" aria-label="Loading your party">
          <div className="skeleton mb-3 h-[9px] w-[64px] rounded bg-[#E3E0DA]" />
          <div className="rounded-[14px] border border-[#E3E0DA] bg-white px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="skeleton size-[30px] shrink-0 rounded-full bg-[#ECE7DF]" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="skeleton h-3 w-2/5 rounded bg-[#ECE7DF]" />
                <div className="skeleton h-2 w-1/4 rounded bg-[#F0ECE5]" />
              </div>
            </div>
            <div className="skeleton mt-3 h-2.5 w-3/5 rounded bg-[#F0ECE5]" />
          </div>

          <div className="skeleton mb-3 mt-6 h-[9px] w-[58px] rounded bg-[#E3E0DA]" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-[14px] border border-[#E3E0DA] bg-white px-4 py-3.5"
              >
                <div className="skeleton size-[30px] shrink-0 rounded-full bg-[#ECE7DF]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-1/2 rounded bg-[#ECE7DF]" />
                  <div className="skeleton h-2 w-1/3 rounded bg-[#F0ECE5]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Your details (primary member) ──────────────────────── */}
      {manifest?.primaryGuest && (
        <div className="mt-6">
          <p className="text-[8px] uppercase tracking-[2.5px] text-[#9A9288] mb-3">
            Your details
          </p>
          <div ref={primaryCardRef}>
            <PrimaryDetailsCard
              primary={manifest.primaryGuest}
              rooms={rooms ?? []}
              isPrimary={isPrimary}
              isEditing={editingPrimary}
              onEditingChange={setEditingPrimary}
            />
          </div>
        </div>
      )}

      {/* ─── Your details (secondary guest) ─────────────────────
          The primary gets PrimaryDetailsCard above; a secondary guest had
          nothing at all and could only read the party list. This is the one
          thing they own. */}
      {ownRecord && (
        <div className="mt-6">
          <p className="mb-3 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
            Your details
          </p>
          <button
            type="button"
            onClick={() => setShowOwnDetails(true)}
            className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#E3E0DA] bg-white px-4 py-4 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[14px] text-[#2B2824]">
                {ownRecord.firstName} {ownRecord.lastName}
              </span>
              <span className="mt-1 block truncate text-[11.5px] text-[#797168]">
                {ownRecord.allergies?.trim()
                  ? ownRecord.allergies
                  : 'No allergies recorded — tap to add'}
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-[#9A9288]"
              aria-hidden
            />
          </button>
        </div>
      )}

      {/* ─── Guest list ─────────────────────────────────────────── */}
      {(manifest?.guests?.length ?? 0) > 0 && (
        <div className="mt-6">
          <p className="text-[8px] uppercase tracking-[2.5px] text-[#9A9288] mb-3">
            Guest details
          </p>
          <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.06, delayChildren: 0.1 },
              },
            }}
          >
            {manifest!.guests.map((guest) => (
              <GuestDetailCard
                key={guest.id}
                guest={guest}
                rooms={rooms ?? []}
                onEdit={!isPrimary ? undefined : () => openEditForm(guest)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* ─── Empty state (no guests yet) ────────────────────────── */}
      {!isLoading && (manifest?.guests?.length ?? 0) === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#E3D9CD] bg-[#FAF8F4] px-6 py-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full border border-[#E3D9CD] bg-[#F3EDE4]">
            <Users
              className="size-5 text-[#8C7261]"
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <p className="font-cormorant text-[18px] text-[#2B2824]">
            No guests added yet
          </p>
          <p className="mt-1.5 max-w-[240px] text-[11px] leading-snug text-[#797168]">
            Add your party so we can prepare rooms, dietary preferences, and
            each guest&apos;s access link.
          </p>
        </div>
      )}

      {/* ─── Allergy reminder ───────────────────────────────────── */}
      {!manifestLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-5 flex items-start gap-2 rounded-[12px] border border-[#E8B4A8] bg-[#FEF6F4] px-3.5 py-3"
        >
          <span className="size-1.5 rounded-full bg-[#B42318] shrink-0 mt-1" />
          <p className="text-[10px] leading-snug text-[#9A3A30]">
            <span className="font-semibold">
              Allergy information is medically critical.
            </span>{' '}
            Include severity and emergency medications when adding guests.
          </p>
        </motion.div>
      )}

      {/* ─── Sticky action bar (only when there's an action) ────── */}
      {
        <div
          ref={actionBarRef}
          className="fixed bottom-[72px] left-0 right-0 z-20 px-4 pb-3 pt-4 bg-gradient-to-t from-timtavio-background via-timtavio-background/95 to-transparent"
        >
          {submitError && (
            <p className="mb-2 rounded-[10px] border border-[#E4B7B2] bg-[#FBEEEA] px-3 py-2 text-center text-[11px] font-medium text-[#9A3A30]">
              {submitError}
            </p>
          )}
          {/* Both jobs, side by side, while both are open — half the height
              of a stack, and neither is the one you have to look for. Labels
              carry the whole distinction at this width, so they say whose
              details rather than which fields: yours, or somebody else's.

              Below 360px there isn't room for two, and a cramped pair of
              truncated labels is worse than a tall bar. */}
          {/* `primaryComplete` falls back to true until the answer lands, so
              the bar spent every load offering Add guest full width — the one
              action a primary with their own room outstanding should not be
              handed first, and then it swapped under their thumb. */}
          {manifestLoading ? (
            <div className="flex gap-2" aria-hidden>
              <div className="skeleton h-12 w-full rounded-[12px] bg-[#E3E0DA]" />
              <div className="skeleton h-12 w-full rounded-[12px] bg-[#E8E5E0]" />
            </div>
          ) : (
            <>
              {isPrimary && !primaryComplete && (
                <div className="mb-2 flex flex-col gap-2 min-[360px]:flex-row">
                  <Button
                    onClick={openPrimaryEditor}
                    className="h-12 w-full gap-1.5 rounded-[12px] bg-[#8A6D17] min-[360px]:flex-1 px-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-white hover:bg-[#9C7C1E]"
                  >
                    <Star className="size-3.5 shrink-0" aria-hidden />
                    Your details
                  </Button>
                  {!partyFull && (
                    <Button
                      onClick={openAddForm}
                      variant="outline"
                      className="h-12 w-full gap-1.5 rounded-[12px] border-[#0F1F2E] min-[360px]:flex-1 bg-white px-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#0F1F2E] hover:bg-[#F5F3F0]"
                    >
                      <Plus className="size-3.5 shrink-0" aria-hidden />
                      Add guest
                    </Button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {canSubmit && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mb-2"
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-[12px] bg-[#1A3040] text-white text-[10px] font-semibold uppercase tracking-[2px] hover:bg-[#0F1F2E] disabled:opacity-60"
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit guest list'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {isPrimary && primaryComplete && !partyFull && (
                <Button
                  onClick={openAddForm}
                  variant={secondaryCount === 0 ? 'default' : 'outline'}
                  className={cn(
                    'w-full h-12 rounded-[12px] text-[10px] font-semibold uppercase tracking-[2px] gap-2',
                    secondaryCount === 0
                      ? 'bg-[#0F1F2E] text-white hover:bg-[#1A3040]'
                      : 'border-[#0F1F2E] bg-white text-[#0F1F2E] hover:bg-[#F5F3F0]',
                  )}
                >
                  <Plus className="size-4" aria-hidden />
                  Add guest
                </Button>
              )}
              {isPrimary && partyFull && primaryComplete && (
                <p className="text-center text-[10px] text-[#797168]">
                  Everyone in your party has been added.
                </p>
              )}
            </>
          )}
        </div>
      }

      {/* ─── Add / edit drawer ──────────────────────────────────── */}
      <GuestManifestForm
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingGuest(null);
        }}
        onCancel={() => {
          setIsAddOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSave}
        onRemoveGuest={
          editingGuest
            ? async () => {
                setRemoveError(null);
                try {
                  await removeGuest.mutateAsync(editingGuest.id);
                  setIsAddOpen(false);
                  setEditingGuest(null);
                } catch (err) {
                  setRemoveError(
                    err instanceof Error
                      ? err.message
                      : 'This guest can no longer be removed — their access link was already sent.',
                  );
                }
              }
            : undefined
        }
        removeError={removeError}
        removing={removeGuest.isPending}
        rooms={rooms}
        guestId={editingGuest?.id}
        initialValues={
          editingGuest ? mapGuestToFormValues(editingGuest) : undefined
        }
        submitLabel={editingGuest ? 'Save changes' : 'Save guest'}
        bookingId={bookingId ?? undefined}
      />

      {/* ─── Post-save completion sheet ─────────────────────────── */}
      {ownRecord && (
        <YourDetailsSheet
          open={showOwnDetails}
          onClose={() => setShowOwnDetails(false)}
          guest={ownRecord}
        />
      )}

      <GuestAddedSheet
        open={showAddedSheet}
        onClose={() => setShowAddedSheet(false)}
        guestFirstName={addedGuestName}
        addedGuests={addedGuests}
        totalGuests={totalGuests}
        onAddAnother={() => {
          setShowAddedSheet(false);
          setTimeout(() => openAddForm(), 150);
        }}
        onViewManifest={() => setShowAddedSheet(false)}
      />
    </div>
  );
};

// ─── GuestDetailCard ──────────────────────────────────────────────────────────

function GuestDetailCard({
  guest,
  rooms,
  onEdit,
}: {
  guest: ManifestGuest;
  rooms: RoomWithAvailability[];
  onEdit?: () => void;
}) {
  const roomName = guest.roomNumber
    ? (rooms.find((r) => r.number === guest.roomNumber)?.name ??
      `Room ${guest.roomNumber}`)
    : null;

  const dietaryTags = (guest.dietaryRestrictions ?? []).map((d) => ({
    label: d.replace(/_/g, ' '),
    color: 'text-[#3A5E48]',
    bg: 'bg-[#EEF5F0]',
    border: 'border-[#3A5E48]/25',
  }));

  const allergyTag = guest.allergies
    ? [
        {
          label: guest.allergies,
          color: 'text-[#B42318]',
          bg: 'bg-[#FEF6F4]',
          border: 'border-[#B42318]/25',
        },
      ]
    : [];

  const tags = [...dietaryTags, ...allergyTag];

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: 'easeOut' },
        },
      }}
      className="rounded-[14px] border border-[#E3E0DA] bg-white px-4 py-3.5 flex flex-col gap-2.5 shadow-[0_1px_3px_rgba(15,31,46,0.05)]"
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-[30px] rounded-full bg-[#0F1F2E] text-[10px] font-bold text-white shrink-0">
            {`${guest.firstName[0] ?? ''}${guest.lastName[0] ?? ''}`.toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#2B2824] leading-none">
              {guest.firstName} {guest.lastName}
            </p>
            {guest.relationship && (
              <p className="text-[9px] uppercase tracking-[1.5px] text-[#9A9288] mt-0.5">
                {guest.relationship}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {roomName && (
            <span className="text-[8.5px] font-medium text-[#2B2824] bg-[#F0EDE6] border border-[#E3E0DA] rounded-full px-2.5 py-1 leading-none">
              {roomName}
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              aria-label={`Edit ${guest.firstName}`}
              className="flex items-center justify-center size-7 rounded-full border border-[#E3E0DA] bg-white text-[#797168] hover:bg-[#F5F3F0] transition-colors"
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Contact */}
      {(guest.email || guest.phone) && (
        <div className="flex flex-col gap-0.5">
          {guest.email && (
            <p className="text-[10px] text-[#797168] truncate">{guest.email}</p>
          )}
          {guest.phone && (
            <p className="text-[10px] text-[#797168]">{guest.phone}</p>
          )}
        </div>
      )}

      {/* Tags */}
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

      {/* Beverage / notes */}
      {(guest.beveragePreferences || guest.specialNotes) && (
        <div className="flex flex-col gap-1 border-t border-[#F0EDE6] pt-2">
          {guest.beveragePreferences && (
            <p className="text-[9.5px] text-[#797168]">
              <span className="font-medium text-[#2B2824]">Beverages: </span>
              {guest.beveragePreferences}
            </p>
          )}
          {guest.specialNotes && (
            <p className="text-[9.5px] text-[#797168]">
              <span className="font-medium text-[#2B2824]">Notes: </span>
              {guest.specialNotes}
            </p>
          )}
        </div>
      )}

      {/* Experiences ordered by this guest */}
      {(guest.experiences?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-[#F0EDE6] pt-2">
          <p className="text-[8px] uppercase tracking-[2px] text-[#9A9288]">
            Experiences
          </p>
          {guest.experiences!.map((exp) => {
            const meta = experienceStatusMeta(exp.status);
            return (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[10.5px] font-medium text-[#2B2824] leading-tight">
                    {exp.name}
                  </p>
                  <p className="text-[8.5px] text-[#9A9288]">
                    {formatExperienceWhen(exp)}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-medium',
                    meta.bg,
                    meta.border,
                    meta.color,
                  )}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function experienceStatusMeta(status: string) {
  switch (status) {
    case 'CONFIRMED':
    case 'IN_PROGRESS':
    case 'READY':
      return {
        label: status === 'READY' ? 'Ready' : 'Confirmed',
        color: 'text-[#3A5E48]',
        bg: 'bg-[#EEF5F0]',
        border: 'border-[#3A5E48]/25',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: 'text-[#797168]',
        bg: 'bg-[#F0EDE6]',
        border: 'border-[#E3E0DA]',
      };
    case 'CANCELLED':
      return {
        label: 'Declined',
        color: 'text-[#B42318]',
        bg: 'bg-[#FEF6F4]',
        border: 'border-[#B42318]/25',
      };
    default:
      return {
        label: 'Pending',
        color: 'text-[#854F0B]',
        bg: 'bg-[#FAEEDA]',
        border: 'border-[#854F0B]/25',
      };
  }
}

function formatExperienceWhen(exp: {
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
}) {
  const dateStr = exp.confirmedDate ?? exp.preferredDate;
  const time = exp.confirmedTime ?? exp.preferredTime;
  try {
    return `${stayDateShort(dateStr)}${time ? ` · ${time}` : ''}`;
  } catch {
    return time ?? '';
  }
}
