'use client';

import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui';

import { GuestListStatusBadge } from '@/components/manager/pages/guests/GuestListStatusBadge';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import type { GuestListItem } from '@/types';

type Props = {
  current: GuestListItem[];
  past: GuestListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const metaLine2 = (guest: GuestListItem) => {
  const party = `Party of ${guest.partySize}`;
  if (guest.memberSince) {
    return `${party} · Member since ${guest.memberSince}`;
  }
  return party;
};

const GuestListRow = ({
  guest,
  selected,
  onSelect,
}: {
  guest: GuestListItem;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'flex w-full items-start gap-2.5 border-b border-[#ebe6df] px-3 py-2.5 text-left transition-colors',
      selected ? 'bg-[#f5f2eb]' : 'bg-white hover:bg-[#faf9f7]',
    )}
  >
    <GuestAvatar initials={guest.initials} className="size-9 text-[11px]" />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[13px] font-semibold leading-tight text-manager-text">
          {guest.name}
        </p>
        <GuestListStatusBadge status={guest.status} />
      </div>
      <p className="mt-0.5 text-sm leading-snug text-manager-text-muted">
        {guest.villa} · {guest.dates}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-[#8a8178]">
        {metaLine2(guest)}
      </p>
    </div>
  </button>
);

export const GuestListPanel = ({
  current,
  past,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: Props) => (
  <aside className="flex w-full shrink-0 flex-col border-r border-[#ebe6df] bg-white lg:w-[288px]">
    <div className="shrink-0 border-b border-[#ebe6df] px-3 py-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#a8a29e]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search guests..."
          className="h-9 rounded-md border-[#e5e0d8] bg-white pl-8 text-[13px] shadow-none placeholder:text-[#a8a29e]"
        />
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto">
      {current.map((guest) => (
        <GuestListRow
          key={guest.id}
          guest={guest}
          selected={guest.id === selectedId}
          onSelect={() => onSelect(guest.id)}
        />
      ))}

      <p className="border-b border-[#ebe6df] px-3 py-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
        Past Guests
      </p>

      {past.map((guest) => (
        <GuestListRow
          key={guest.id}
          guest={guest}
          selected={guest.id === selectedId}
          onSelect={() => onSelect(guest.id)}
        />
      ))}
    </div>
  </aside>
);
