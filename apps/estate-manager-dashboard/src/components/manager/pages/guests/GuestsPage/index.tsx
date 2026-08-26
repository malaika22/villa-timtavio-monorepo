'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { GuestDetailPanel } from '@/components/manager/pages/guests/GuestDetailPanel';
import { GuestListPanel } from '@/components/manager/pages/guests/GuestListPanel';
import { useGuestProfile, useGuests } from '@/hooks/useGuests';
import type { GuestListItem } from '@/types';

function GuestDetailSkeleton() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#f9f7f2] px-6 py-6">
      <div className="h-16 w-64 animate-pulse rounded-lg bg-manager-border" />
      <div className="h-4 w-40 animate-pulse rounded bg-manager-border" />
      <div className="mt-2 h-40 animate-pulse rounded-xl bg-manager-border" />
      <div className="h-32 animate-pulse rounded-xl bg-manager-border" />
    </div>
  );
}

function GuestDetailEmpty() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center bg-[#f9f7f2] px-6 text-center">
      <p className="font-cormorant text-2xl text-manager-text">No guests yet</p>
      <p className="mt-2 max-w-xs text-sm text-manager-text-muted">
        Guests appear here once a booking syncs from Lodgify or you add one
        manually.
      </p>
    </div>
  );
}

function filterGuests(items: GuestListItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  // Name and dates — what the row actually shows. It used to search the villa
  // and the join year as well, which on a one-property estate where everybody
  // joined in 2026 meant "villa" matched everyone and "2026" matched everyone.
  return items.filter(
    (g) =>
      g.name.toLowerCase().includes(q) || g.dates.toLowerCase().includes(q),
  );
}

/**
 * Soonest arrival first.
 *
 * The API returns guests in no particular order, so the list read 1 Oct,
 * 15 Nov, 5 Aug, 12 Oct, 9 Oct — which is no help at all to someone asking
 * who is next. Guests without a booking sort last rather than to 1970.
 */
function byArrival(a: GuestListItem, b: GuestListItem) {
  if (!a.checkIn) return 1;
  if (!b.checkIn) return -1;
  return a.checkIn.localeCompare(b.checkIn);
}

export const GuestsPage = () => {
  const searchParams = useSearchParams();
  const guestFromUrl = searchParams.get('guest');
  const [selectedId, setSelectedId] = useState<string | null>(guestFromUrl);
  const [prevGuestFromUrl, setPrevGuestFromUrl] = useState(guestFromUrl);
  const [search, setSearch] = useState('');

  if (guestFromUrl !== prevGuestFromUrl) {
    setPrevGuestFromUrl(guestFromUrl);
    if (guestFromUrl) setSelectedId(guestFromUrl);
  }

  const { current: apiCurrent, past: apiPast, loading } = useGuests(search);

  const current = useMemo(
    () => filterGuests(apiCurrent, search).sort(byArrival),
    [apiCurrent, search],
  );
  // Past guests read backwards: most recent departure first.
  const past = useMemo(
    () => filterGuests(apiPast, search).sort((a, b) => byArrival(b, a)),
    [apiPast, search],
  );

  const allItems = useMemo(
    () => [...apiCurrent, ...apiPast],
    [apiCurrent, apiPast],
  );
  // Fall through to past guests too — otherwise a stay that has checked out
  // (only past guests remain) wrongly renders the "No guests yet" empty state.
  const selectedItem =
    allItems.find((g) => g.id === selectedId) ??
    current[0] ??
    past[0] ??
    apiCurrent[0] ??
    apiPast[0] ??
    null;

  const profileQuery = useGuestProfile(selectedItem?.id ?? null);
  const profile = profileQuery.data ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <GuestListPanel
        current={current}
        past={past}
        selectedId={selectedItem?.id ?? ''}
        onSelect={setSelectedId}
        search={search}
        onSearchChange={setSearch}
      />
      {loading ? (
        <GuestDetailSkeleton />
      ) : !selectedItem ? (
        <GuestDetailEmpty />
      ) : profile ? (
        <GuestDetailPanel profile={profile} />
      ) : (
        <GuestDetailSkeleton />
      )}
    </div>
  );
};
