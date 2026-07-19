'use client';

import Link from 'next/link';
import { BedDouble, ChevronRight } from 'lucide-react';

import { useManifest } from '@/hooks/useManifest';
import { usePendingApprovalRequests } from '@/hooks/useRequests';
import { useAuth } from '@/hooks/useAuth';

export const PartyPage = () => {
  const { data: manifest } = useManifest();
  const { data: pending = [] } = usePendingApprovalRequests();
  const { firstName } = useAuth();

  const guests = manifest?.guests ?? [];
  const rooms = (manifest?.roomSummary ?? []).filter(
    (r) => r.assignedGuests > 0,
  );
  const primaryName = manifest?.primaryGuest?.firstName ?? firstName ?? 'You';

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
        <h2 className="text-[10px] font-semibold tracking-[2px] text-[#797168] uppercase">
          Guests
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-[#E3E0DA] bg-white">
          <li className="flex items-center justify-between border-b border-[#F0EDE8] px-4 py-3.5 last:border-0">
            <div>
              <p className="text-sm font-medium text-[#2B2824]">{primaryName}</p>
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
    </div>
  );
};
