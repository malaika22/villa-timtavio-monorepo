'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BedDouble, ChevronRight, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';

import { useManifest } from '@/hooks/useManifest';
import { usePendingApprovalRequests } from '@/hooks/useRequests';
import { useAuth } from '@/hooks/useAuth';
import { RequestDetailView } from '@/components/Status/RequestDetailView';
import { stayDateShort } from '@/lib/stay-date';

function expStatusMeta(status: string) {
  switch (status) {
    case 'READY':
      return {
        label: 'Ready',
        color: 'text-[#3A5E48]',
        bg: 'bg-[#EEF5F0]',
        border: 'border-[#3A5E48]/25',
      };
    case 'CONFIRMED':
    case 'IN_PROGRESS':
      return {
        label: status === 'IN_PROGRESS' ? 'In progress' : 'Confirmed',
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

function formatExpWhen(exp: {
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
}) {
  const date = exp.confirmedDate ?? exp.preferredDate;
  const time = exp.confirmedTime ?? exp.preferredTime;
  try {
    return `${stayDateShort(date)}${time ? ` · ${time}` : ''}`;
  } catch {
    return time ?? '';
  }
}

export const PartyPage = () => {
  const { data: manifest } = useManifest();
  const { data: pending = [] } = usePendingApprovalRequests();
  const { firstName } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const guests = manifest?.guests ?? [];
  const rooms = (manifest?.roomSummary ?? []).filter(
    (r) => r.assignedGuests > 0,
  );
  const primaryName = manifest?.primaryGuest?.firstName ?? firstName ?? 'You';

  // The whole party's experiences (primary + each secondary), so the host can
  // track everyone's requests and their live status in one place.
  const partyExperiences = [
    ...(manifest?.primaryGuest?.experiences ?? []).map((e) => ({
      ...e,
      who: primaryName,
    })),
    ...guests.flatMap((g) =>
      (g.experiences ?? []).map((e) => ({ ...e, who: g.firstName })),
    ),
  ];

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pt-6 pb-28">
      <header className="space-y-1">
        <h1 className="font-cormorant text-[28px] leading-tight font-medium italic text-[#2B2824]">
          Your Party
        </h1>
        <p className="text-[10px] font-medium tracking-[2.8px] text-[#797168] uppercase">
          Who&apos;s staying · rooms · approvals
        </p>
      </header>

      {pending.length > 0 && (
        <Link
          href="/approvals"
          className="flex items-center justify-between rounded-2xl bg-[#0F1F2E] px-4 py-4 text-white transition-opacity active:opacity-90"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {pending.length} request{pending.length === 1 ? '' : 's'} awaiting
              your approval
            </p>
            <p className="mt-0.5 text-[11px] text-white/60">
              Review paid experiences your party requested
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-white/70" />
        </Link>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold tracking-[2px] text-[#797168] uppercase">
            Experiences
          </h2>
          <Link
            href="/status"
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#0F1F2E]"
          >
            Live status
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        {partyExperiences.length === 0 ? (
          <Link
            href="/experiences"
            className="flex items-center justify-between rounded-2xl border border-dashed border-[#E3D9CD] bg-[#FAF8F4] px-4 py-4"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-[#8C7261]" aria-hidden />
              <p className="text-[12px] text-[#797168]">
                No experiences requested yet — browse and request.
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-[#B0AAA0]" />
          </Link>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[#E3E0DA] bg-white">
            {partyExperiences.map((exp) => {
              const meta = expStatusMeta(exp.status);
              return (
                <li
                  key={exp.id}
                  className="border-b border-[#F0EDE8] last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(exp.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-[#FAF8F4]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#2B2824]">
                        {exp.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#9A9288]">
                        {exp.who} · {formatExpWhen(exp)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[10px] font-medium',
                          meta.bg,
                          meta.border,
                          meta.color,
                        )}
                      >
                        {meta.label}
                      </span>
                      <ChevronRight className="size-4 text-[#B0AAA0]" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[10px] font-semibold tracking-[2px] text-[#797168] uppercase">
          Guests
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-[#E3E0DA] bg-white">
          <li className="flex items-center justify-between border-b border-[#F0EDE8] px-4 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-medium text-[#2B2824]">
                {primaryName}
              </p>
              <p className="text-[11px] text-[#9A9288]">Primary member</p>
            </div>
          </li>
          {guests.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-3 border-b border-[#F0EDE8] px-4 py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#2B2824]">
                  {g.firstName} {g.lastName}
                </p>
                {g.dietaryRestrictions && g.dietaryRestrictions.length > 0 && (
                  <p className="mt-0.5 truncate text-[11px] text-[#9A9288]">
                    {g.dietaryRestrictions.join(', ')}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-[#F0EDE8] px-2.5 py-1 text-[11px] font-medium text-[#5C534A]">
                {g.roomNumber ? `Room ${g.roomNumber}` : 'No room'}
              </span>
            </li>
          ))}
          {guests.length === 0 && (
            <li className="px-4 py-6 text-center text-[12px] text-[#9A9288]">
              No guests added yet.
            </li>
          )}
        </ul>
      </section>

      {rooms.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[10px] font-semibold tracking-[2px] text-[#797168] uppercase">
            Rooms in use
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {rooms.map((r) => (
              <li
                key={r.roomNumber}
                className="rounded-xl border border-[#E3E0DA] bg-white px-3.5 py-3"
              >
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#2B2824]">
                  <BedDouble className="size-3.5 text-[#9A9288]" />
                  {r.roomName}
                </p>
                <p className="mt-1 text-[11px] text-[#9A9288]">
                  {r.assignedGuests} / {r.capacity} guests
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RequestDetailView
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        id={selectedId}
      />
    </div>
  );
};
