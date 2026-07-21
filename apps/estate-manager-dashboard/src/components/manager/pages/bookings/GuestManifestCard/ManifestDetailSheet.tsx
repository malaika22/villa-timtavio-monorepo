'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { Button, Input } from '@repo/ui';
import {
  CheckCircle2,
  Send,
  AlertTriangle,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type {
  ManifestResponse,
  ManifestGuest,
  GuestArrivalStatus,
} from '@repo/api-types';
import {
  useApproveManifest,
  useResendGuestLink,
  useUpdateManifestGuest,
  useSetGuestArrivalStatus,
  useSetPrimaryArrivalStatus,
} from '@/hooks/useManifest';
import { toast } from 'sonner';

type ManifestDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  manifest: ManifestResponse;
};

export function ManifestDetailSheet({
  open,
  onClose,
  bookingId,
  manifest,
}: ManifestDetailSheetProps) {
  const approveManifest = useApproveManifest();
  const resendLink = useResendGuestLink();
  const updateGuest = useUpdateManifestGuest(bookingId);
  const setGuestArrival = useSetGuestArrivalStatus(bookingId);
  const setPrimaryArrival = useSetPrimaryArrivalStatus(bookingId);

  // EM can correct guest details while reviewing a submitted manifest.
  const canEdit = manifest.manifestStatus === 'SUBMITTED';
  // Presence tracking only becomes meaningful once guests are confirmed.
  const showPresence = manifest.manifestStatus === 'APPROVED';

  const handleSetArrival = (guestId: string, status: GuestArrivalStatus) => {
    setGuestArrival.mutate(
      { guestId, status },
      { onError: () => toast.error('Failed to update presence') },
    );
  };

  const handleApprove = async () => {
    await approveManifest.mutateAsync(bookingId);
    toast.success('Manifest approved', {
      description: 'Guest PWA links have been sent to all guests.',
    });
    onClose();
  };

  const handleResend = (guestId: string, name: string) => {
    resendLink.mutate(
      { bookingId, guestId },
      {
        onSuccess: () => toast.success(`Link resent to ${name}`),
        onError: () => toast.error(`Failed to resend link to ${name}`),
      },
    );
  };

  // ── Party roll-ups for the safety rail ──────────────────────────────────
  const allergyList = [
    ...(manifest.primaryGuest.allergies
      ? [
          {
            name: manifest.primaryGuest.firstName,
            allergy: manifest.primaryGuest.allergies,
          },
        ]
      : []),
    ...manifest.guests
      .filter((g) => g.allergies)
      .map((g) => ({ name: g.firstName, allergy: g.allergies as string })),
  ];
  const dietaryCounts = (() => {
    const map = new Map<string, number>();
    const add = (arr?: string[] | null) =>
      (arr ?? []).forEach((d) => map.set(d, (map.get(d) ?? 0) + 1));
    add(manifest.primaryGuest.dietaryRestrictions);
    manifest.guests.forEach((g) => add(g.dietaryRestrictions));
    return [...map.entries()];
  })();
  const roomsInUse = manifest.roomSummary.filter(
    (r) => r.assignedGuests > 0,
  ).length;
  const roomsAssigned =
    manifest.primaryGuest.roomNumber != null &&
    manifest.guests.every((g) => g.roomNumber != null);

  const markAllPresence = (status: GuestArrivalStatus) => {
    setPrimaryArrival.mutate(status);
    manifest.guests.forEach((g) =>
      setGuestArrival.mutate({ guestId: g.id, status }),
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[820px] overflow-y-auto p-0 bg-[#fdfdfb]"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#e8e4de]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="font-cormorant text-2xl text-[#1a1614] font-medium leading-tight">
                Guest Manifest
              </SheetTitle>
              <p className="text-sm text-[#8a8178] mt-0.5">
                Casa TimTavio · {manifest.addedGuests} of {manifest.totalGuests}{' '}
                guests
              </p>
            </div>
            <StatusBadge status={manifest.manifestStatus} />
          </div>
        </SheetHeader>

        {/* Two-column body: roster + summary rail */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_290px]">
          {/* ── Left: roster ── */}
          <div className="px-6 py-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178] mb-3">
              Party · {manifest.addedGuests} of {manifest.totalGuests}
            </h3>
            <div className="flex flex-col gap-2.5">
              <PrimaryGuestCard
                primary={manifest.primaryGuest}
                roomSummary={manifest.roomSummary}
                showPresence={showPresence}
                onSetArrival={(status) => setPrimaryArrival.mutate(status)}
              />
              {manifest.guests.map((guest) => (
                <GuestCard
                  key={guest.id}
                  guest={guest}
                  roomSummary={manifest.roomSummary}
                  onResend={
                    manifest.manifestStatus === 'APPROVED'
                      ? () => handleResend(guest.id, guest.firstName)
                      : undefined
                  }
                  resendPending={resendLink.isPending}
                  canEdit={canEdit}
                  onSave={async (dto) => {
                    await updateGuest.mutateAsync({ guestId: guest.id, dto });
                    toast.success('Guest updated');
                  }}
                  saving={updateGuest.isPending}
                  showPresence={showPresence}
                  onSetArrival={(status) => handleSetArrival(guest.id, status)}
                />
              ))}
            </div>
          </div>

          {/* ── Right: summary rail ── */}
          <div className="border-t md:border-t-0 md:border-l border-[#e8e4de] bg-[#faf9f7] px-5 py-6 flex flex-col gap-4">
            {/* Counts */}
            <div className="rounded-xl border border-[#e8e4de] bg-white p-4 flex gap-8">
              <div>
                <div className="font-cormorant text-2xl leading-none text-[#1a1614]">
                  {manifest.addedGuests}
                  <span className="text-base text-[#b3aaa0]"> guests</span>
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[#8a8178] mt-1.5">
                  Incl. primary
                </div>
              </div>
              <div>
                <div className="font-cormorant text-2xl leading-none text-[#1a1614]">
                  {roomsInUse}
                  <span className="text-base text-[#b3aaa0]"> rooms</span>
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[#8a8178] mt-1.5">
                  In use
                </div>
              </div>
            </div>

            {/* Allergies & dietary (aggregated) */}
            {(allergyList.length > 0 || dietaryCounts.length > 0) && (
              <div className="rounded-xl border border-[#e8e4de] bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c53030]">
                  ⚠ Allergies &amp; dietary
                </p>
                {allergyList.length > 0 && (
                  <div className="mt-2">
                    {allergyList.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#f0ece6] py-1.5 text-[13px] last:border-0"
                      >
                        <span className="font-semibold text-[#1a1614]">
                          {a.name}
                        </span>
                        <span className="text-right text-[#c53030]">
                          {a.allergy}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {dietaryCounts.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {dietaryCounts.map(([d, n]) => (
                      <span
                        key={d}
                        className="rounded-full bg-[#e8f1e9] px-2.5 py-0.5 text-[11px] capitalize text-[#3a6448]"
                      >
                        {d.replace(/_/g, ' ')} ×{n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Room occupancy */}
            {roomsInUse > 0 && (
              <div className="rounded-xl border border-[#e8e4de] bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178]">
                  Room occupancy
                </p>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {manifest.roomSummary
                    .filter((r) => r.assignedGuests > 0)
                    .map((room) => {
                      const full = room.assignedGuests >= room.capacity;
                      const pct = Math.min(
                        100,
                        Math.round(
                          (room.assignedGuests / Math.max(room.capacity, 1)) *
                            100,
                        ),
                      );
                      return (
                        <div key={room.roomNumber}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate text-[#4a453f]">
                              {room.roomName}
                            </span>
                            <span className="tabular-nums text-[#8a8178]">
                              {room.assignedGuests} / {room.capacity}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8e4de]">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                full ? 'bg-[#c7a046]' : 'bg-[#4a7c59]',
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — review (approve) vs. ops (bulk presence) */}
        {manifest.manifestStatus === 'SUBMITTED' && (
          <div className="sticky bottom-0 border-t border-[#e8e4de] bg-[#fdfdfb] px-6 py-4">
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#4a453f]">
                <Check className="size-3.5 text-[#4a7c59]" />
                {manifest.addedGuests} of {manifest.totalGuests} guests
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#4a453f]">
                {roomsAssigned ? (
                  <Check className="size-3.5 text-[#4a7c59]" />
                ) : (
                  <AlertTriangle className="size-3.5 text-[#b45309]" />
                )}
                Rooms assigned
              </span>
              {allergyList.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[#4a453f]">
                  <AlertTriangle className="size-3.5 text-[#b45309]" />
                  {allergyList.length}{' '}
                  {allergyList.length === 1 ? 'allergy' : 'allergies'} to review
                </span>
              )}
            </div>
            <Button
              onClick={handleApprove}
              disabled={approveManifest.isPending}
              className="w-full h-11 gap-2 rounded-xl bg-[#4a7c59] text-sm font-medium text-white hover:bg-[#3a6448] disabled:opacity-60"
            >
              <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
              {approveManifest.isPending ? 'Approving…' : 'Approve Manifest'}
            </Button>
          </div>
        )}
        {manifest.manifestStatus === 'APPROVED' && (
          <div className="sticky bottom-0 flex gap-2 border-t border-[#e8e4de] bg-[#fdfdfb] px-6 py-4">
            <Button
              variant="outline"
              onClick={() => markAllPresence('DEPARTED')}
              className="h-11 flex-1 rounded-xl border-[#e5e0d8] text-sm font-medium text-[#3d3530]"
            >
              Mark all departed
            </Button>
            <Button
              onClick={() => markAllPresence('IN_VILLA')}
              className="h-11 flex-1 rounded-xl bg-[#4a7c59] text-sm font-medium text-white hover:bg-[#3a6448]"
            >
              Mark all in villa
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── GuestCard ────────────────────────────────────────────────────────────────

function GuestCard({
  guest,
  roomSummary,
  onResend,
  resendPending,
  canEdit,
  onSave,
  saving,
  showPresence,
  onSetArrival,
}: {
  guest: ManifestGuest;
  roomSummary: ManifestResponse['roomSummary'];
  onResend?: () => void;
  resendPending: boolean;
  canEdit?: boolean;
  onSave?: (dto: {
    firstName?: string;
    lastName?: string;
    roomNumber?: number;
    allergies?: string;
  }) => Promise<void>;
  saving?: boolean;
  showPresence?: boolean;
  onSetArrival?: (status: GuestArrivalStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(guest.firstName);
  const [lastName, setLastName] = useState(guest.lastName);
  const [roomNumber, setRoomNumber] = useState<string>(
    guest.roomNumber != null ? String(guest.roomNumber) : '',
  );
  const [allergies, setAllergies] = useState(guest.allergies ?? '');

  const roomName = guest.roomNumber
    ? (roomSummary.find((r) => r.roomNumber === guest.roomNumber)?.roomName ??
      `Room ${guest.roomNumber}`)
    : null;

  const hasDietary = guest.dietaryRestrictions?.length > 0;
  const hasExtra =
    guest.allergies || guest.beveragePreferences || guest.specialNotes;

  const startEdit = () => {
    setFirstName(guest.firstName);
    setLastName(guest.lastName);
    setRoomNumber(guest.roomNumber != null ? String(guest.roomNumber) : '');
    setAllergies(guest.allergies ?? '');
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = async () => {
    await onSave?.({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      roomNumber: roomNumber ? Number(roomNumber) : undefined,
      allergies: allergies.trim() || undefined,
    });
    setEditing(false);
  };

  // ─── Edit mode ───────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="rounded-xl border border-[#cdd9cf] bg-white p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178]">
              First name
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178]">
              Last name
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178]">
            Room
          </label>
          <select
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-[#d4d0c8] bg-white px-2.5 text-sm text-[#1a1614]"
          >
            <option value="">Unassigned</option>
            {roomSummary.map((r) => (
              <option key={r.roomNumber} value={r.roomNumber}>
                {r.roomName} (Room {r.roomNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#c53030]">
            Allergy notes
          </label>
          <Input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Severe nut allergy — carries EpiPen"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 flex-1 gap-1.5 rounded-lg bg-[#4a7c59] text-xs font-medium text-white hover:bg-[#3a6448] disabled:opacity-60"
          >
            <Check className="size-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="h-8 gap-1.5 rounded-lg border-[#d4d0c8] text-xs font-medium text-[#3d3530]"
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
      {/* Main row */}
      <div className="flex items-start justify-between px-4 py-3.5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center size-8 rounded-full bg-[#1a1614] text-xs font-bold text-white shrink-0">
            {`${guest.firstName[0] ?? ''}${guest.lastName[0] ?? ''}`.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1614] leading-none">
              {guest.firstName} {guest.lastName}
            </p>
            <p className="text-xs text-[#8a8178] mt-0.5 truncate">
              {guest.email}
            </p>
            {guest.relationship && (
              <p className="text-[10px] uppercase tracking-wider text-[#b0aaa0] mt-0.5">
                {guest.relationship}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {roomName && (
              <span className="text-xs font-medium text-[#4a7c59] bg-[#e8f1e9] rounded-full px-2.5 py-0.5">
                {roomName}
              </span>
            )}
            {canEdit && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1 text-[10px] font-medium text-[#4a7c59] underline underline-offset-2"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
            {/* Resend link — surfaced inline once the manifest is approved. */}
            {onResend && (
              <button
                onClick={onResend}
                disabled={resendPending}
                className="flex items-center gap-1 text-[10px] font-medium text-[#4a7c59] underline underline-offset-2 disabled:opacity-50"
              >
                <Send className="size-3" />
                Resend link
              </button>
            )}
            {(hasDietary || hasExtra) && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-medium text-[#8a8178] underline underline-offset-2"
              >
                {expanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
          {/* Presence (post-approval) — inline, no separate band */}
          {showPresence && onSetArrival && (
            <ArrivalStatusPills
              value={guest.arrivalStatus}
              onChange={onSetArrival}
            />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#f0ece6]">
          {hasDietary && (
            <div className="pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178] mb-1.5">
                Dietary
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guest.dietaryRestrictions.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-[#3a6448]/25 bg-[#e8f1e9] px-2.5 py-0.5 text-xs font-medium text-[#3a6448] capitalize"
                  >
                    {d.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {guest.allergies && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c53030] mb-1">
                ⚠ Allergy
              </p>
              <p className="text-sm text-[#6b2626]">{guest.allergies}</p>
            </div>
          )}
          {guest.beveragePreferences && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178] mb-1">
                Beverages
              </p>
              <p className="text-sm text-[#3d3530]">
                {guest.beveragePreferences}
              </p>
            </div>
          )}
          {guest.specialNotes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178] mb-1">
                Notes
              </p>
              <p className="text-sm text-[#3d3530]">{guest.specialNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PrimaryGuestCard ────────────────────────────────────────────────────────

function PrimaryGuestCard({
  primary,
  roomSummary,
  showPresence,
  onSetArrival,
}: {
  primary: ManifestResponse['primaryGuest'];
  roomSummary: ManifestResponse['roomSummary'];
  showPresence?: boolean;
  onSetArrival: (status: GuestArrivalStatus) => void;
}) {
  const roomName = primary.roomNumber
    ? (roomSummary.find((r) => r.roomNumber === primary.roomNumber)?.roomName ??
      `Room ${primary.roomNumber}`)
    : null;
  const hasDietary = (primary.dietaryRestrictions?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3.5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center size-8 rounded-full bg-[#c7a046] text-xs font-bold text-white shrink-0">
            {`${primary.firstName[0] ?? ''}${primary.lastName[0] ?? ''}`.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1614] leading-none">
              {primary.firstName} {primary.lastName}
            </p>
            <p className="text-xs text-[#8a8178] mt-0.5 truncate">
              {primary.email}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[#b08a2e] mt-0.5">
              Primary guest
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {roomName && (
            <span className="text-xs font-medium text-[#4a7c59] bg-[#e8f1e9] rounded-full px-2.5 py-0.5">
              {roomName}
            </span>
          )}
          {showPresence && (
            <ArrivalStatusPills
              value={primary.arrivalStatus}
              onChange={onSetArrival}
            />
          )}
        </div>
      </div>

      {(hasDietary || primary.allergies || primary.beveragePreferences) && (
        <div className="px-4 pb-3 space-y-2 border-t border-[#f0ece6]">
          {hasDietary && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {primary.dietaryRestrictions.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-[#3a6448]/25 bg-[#e8f1e9] px-2.5 py-0.5 text-xs font-medium text-[#3a6448] capitalize"
                >
                  {d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {primary.allergies && (
            <p className="text-sm text-[#6b2626]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c53030]">
                ⚠ Allergy:{' '}
              </span>
              {primary.allergies}
            </p>
          )}
          {primary.beveragePreferences && (
            <p className="text-sm text-[#3d3530]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8178]">
                Beverages:{' '}
              </span>
              {primary.beveragePreferences}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ArrivalStatusPills ──────────────────────────────────────────────────────

// Presence segmented control. Each status has a semantic active colour (like
// the guest-facing status chips) and the SAME control renders for the primary
// and secondaries, so they read identically.
const ARRIVAL_OPTIONS: {
  value: GuestArrivalStatus;
  label: string;
  active: string;
}[] = [
  { value: 'EXPECTED', label: 'Expected', active: 'bg-[#efece6] text-[#5b544c]' },
  { value: 'IN_VILLA', label: 'In villa', active: 'bg-[#4a7c59] text-white' },
  { value: 'DEPARTED', label: 'Departed', active: 'bg-[#6b6459] text-white' },
];

function ArrivalStatusPills({
  value,
  onChange,
}: {
  value: GuestArrivalStatus;
  onChange: (status: GuestArrivalStatus) => void;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-full border border-[#e8e4de] bg-[#faf9f7] p-0.5">
      {ARRIVAL_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !isActive && onChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              isActive
                ? opt.active
                : 'text-[#8a8178] hover:text-[#3d3530]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    INCOMPLETE: {
      label: 'Incomplete',
      bg: '#fef9e7',
      text: '#9a6a23',
      dot: '#e67e22',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: '#fef9e7',
      text: '#9a6a23',
      dot: '#e67e22',
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: '#e8f1e9',
      text: '#3a6448',
      dot: '#4a7c59',
    },
    APPROVED: {
      label: 'Approved',
      bg: '#e8f1e9',
      text: '#3a6448',
      dot: '#4a7c59',
    },
  };
  const s = map[status] ?? map.INCOMPLETE!;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shrink-0',
      )}
      style={{ background: s.bg, color: s.text }}
    >
      <span
        className="size-2 rounded-full shrink-0"
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}
