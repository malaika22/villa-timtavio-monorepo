'use client';

import { useMemo, useState } from 'react';

import { GuestDetailPanel } from '@/components/manager/pages/guests/GuestDetailPanel';
import { GuestListPanel } from '@/components/manager/pages/guests/GuestListPanel';
import { useGuestProfile, useGuests } from '@/hooks/useGuests';
import { guestListCurrent, getGuestProfile } from '@/lib/guest-dna-mock-data';
import type { GuestListItem } from '@/types';

function filterGuests(items: GuestListItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.villa.toLowerCase().includes(q) ||
      (g.memberSince?.includes(q) ?? false),
  );
}

export const GuestsPage = () => {
  const [selectedId, setSelectedId] = useState('jm');
  const [search, setSearch] = useState('');

  const { current: apiCurrent, past: apiPast } = useGuests(search);

  const current = useMemo(
    () => filterGuests(apiCurrent, search),
    [apiCurrent, search],
  );
  const past = useMemo(() => filterGuests(apiPast, search), [apiPast, search]);

  const allItems = useMemo(
    () => [...apiCurrent, ...apiPast],
    [apiCurrent, apiPast],
  );
  const selectedItem =
    allItems.find((g) => g.id === selectedId) ??
    current[0] ??
    guestListCurrent[0]!;

  const profileQuery = useGuestProfile(selectedItem.id);
  const profile =
    profileQuery.data ?? getGuestProfile(selectedItem.id, selectedItem);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <GuestListPanel
        current={current}
        past={past}
        selectedId={selectedId}
        onSelect={setSelectedId}
        search={search}
        onSearchChange={setSearch}
      />
      <GuestDetailPanel profile={profile} />
    </div>
  );
};
