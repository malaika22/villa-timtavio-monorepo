'use client';

import { ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';
import { useManifest } from '@/hooks/useManifest';
import { useBookingRequests } from '@/hooks/useRequests';

/** Requests that are still going somewhere — not finished, not cancelled. */
const LIVE_STATUSES = ['PENDING', 'CONFLICT', 'CONFIRMED', 'IN_PROGRESS', 'READY'];

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** "Sara", "Sara and Marcus", "Sara, Marcus and 2 more" */
function listNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

/**
 * The primary's way into the party hub. Replaces the folio card that used to
 * sit here — a running total above the fold made the stay feel metered.
 *
 * Only renders once there is actually a party to look at. An empty "see what
 * your guests are doing" card, on a booking with no secondary guests, is
 * decoration occupying the best space on the page — and the manifest prompt
 * directly above already handles inviting them.
 */
export const PartyCard = () => {
  const { email } = useAuth();
  const { data: manifest } = useManifest();
  const { data: requests = [] } = useBookingRequests();

  const guests = manifest?.guests ?? [];
  if (guests.length === 0) return null;

  const names = guests.map((g) => firstName(`${g.firstName} ${g.lastName}`));

  // Only the party's own activity — the primary's requests aren't news to them.
  const partyRequests = requests.filter(
    (r) =>
      LIVE_STATUSES.includes(r.status) &&
      (!email || r.requestedByEmail?.toLowerCase() !== email.toLowerCase()),
  );

  const detail =
    partyRequests.length > 0
      ? `${partyRequests.length} experience${
          partyRequests.length === 1 ? '' : 's'
        } in motion — see what they're up to.`
      : `${guests.length} guest${guests.length === 1 ? '' : 's'} in your party. See what they're planning.`;

  return (
    <Link
      href="/party"
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[#E3E0DA] bg-white p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)] transition-colors hover:bg-[#FAF9F7]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#E3E0DA] bg-[#F5F0E8]">
        <Users className="size-5 text-[#8A6D3B]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
          {listNames(names)}
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-[#797168]">
          {detail}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#797168]" aria-hidden />
    </Link>
  );
};
