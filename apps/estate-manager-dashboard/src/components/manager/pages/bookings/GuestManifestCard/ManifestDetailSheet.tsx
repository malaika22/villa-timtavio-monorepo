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
  BedDouble,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { ManifestResponse, ManifestGuest } from '@repo/api-types';
import {
  useApproveManifest,
  useResendGuestLink,
  useUpdateManifestGuest,
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

  // EM can correct guest details while reviewing a submitted manifest.
  const canEdit = manifest.manifestStatus === 'SUBMITTED';

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

  const hasAllergies = manifest.guests.some((g) => g.allergies);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] overflow-y-auto p-0 bg-[#fdfdfb]"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#e8e4de]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="font-cormorant text-2xl text-[#1a1614] font-medium leading-tight">
                Guest Manifest
              </SheetTitle>
              <p className="text-sm text-[#8a8178] mt-0.5">
                {manifest.addedGuests} of {manifest.totalGuests} guests added
              </p>
            </div>
            <StatusBadge status={manifest.manifestStatus} />
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Allergy alert */}
          {hasAllergies && (
            <div className="flex items-start gap-3 rounded-xl border border-[#f0c4bc] bg-[#fef6f4] px-4 py-3">
              <AlertTriangle className="size-4 text-[#c53030] shrink-0 mt-0.5" />
              <p className="text-sm text-[#9a3a30]">
                <span className="font-semibold">Allergy alerts present.</span>{' '}
                Review each guest&apos;s allergy details carefully before
                approval.
              </p>
            </div>
          )}

          {/* Guest list */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8a8178]">
              Guests ({manifest.guests.length})
            </h3>
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
              />
            ))}
          </div>

          {/* Room summary */}
          {manifest.roomSummary.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8a8178]">
                Room summary
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {manifest.roomSummary.map((room) => (
                  <div
                    key={room.roomNumber}
                    className="rounded-xl border border-[#dce5dc] bg-[#f4f7f4] px-3.5 py-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="size-3.5 text-[#4a7c59] shrink-0" />
                      <p className="text-sm font-medium text-[#1a1614] truncate">
                        {room.roomName}
                      </p>
                    </div>
                    <p className="text-xs text-[#4a7c59] font-medium">
                      {room.assignedGuests} / {room.capacity} guests
                    </p>
                    <div className="h-1 rounded-full bg-[#dce5dc] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4a7c59] transition-all"
                        style={{
                          width: `${Math.round((room.assignedGuests / room.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {manifest.manifestStatus === 'SUBMITTED' && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-[#e8e4de] bg-[#fdfdfb]">
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
        <div className="flex items-center gap-1.5 shrink-0">
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
          {(hasDietary || hasExtra) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] font-medium text-[#8a8178] underline underline-offset-2"
            >
              {expanded ? 'Less' : 'More'}
            </button>
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
          {onResend && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResend}
              disabled={resendPending}
              className="mt-1 h-8 gap-1.5 text-xs font-medium border-[#d4d0c8] text-[#3d3530]"
            >
              <Send className="size-3.5" />
              Resend PWA link
            </Button>
          )}
        </div>
      )}
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
