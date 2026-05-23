'use client';

import { useMemo, useState } from 'react';

import { GuestDetailPanel } from '@/components/manager/pages/guests/GuestDetailPanel';
import { GuestListPanel } from '@/components/manager/pages/guests/GuestListPanel';
import {
  getGuestProfile,
  guestListCurrent,
  guestListPast,
} from '@/lib/guest-dna-mock-data';
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

  const current = useMemo(() => filterGuests(guestListCurrent, search), [search]);
  const past = useMemo(() => filterGuests(guestListPast, search), [search]);

  const allItems = useMemo(() => [...guestListCurrent, ...guestListPast], []);
  const selectedItem =
    allItems.find((g) => g.id === selectedId) ?? guestListCurrent[0]!;
  const profile = getGuestProfile(selectedItem.id, selectedItem);

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
