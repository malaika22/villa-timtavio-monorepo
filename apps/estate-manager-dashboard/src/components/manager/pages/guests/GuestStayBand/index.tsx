import { cn } from '@repo/ui/lib/utils';
import type { ManifestStatus } from '@repo/api-types';

import { stayDateLong } from '@/lib/stay-date';
import type { GuestDNAProfile } from '@/types';

const MANIFEST: Record<ManifestStatus, { label: string; tone: string }> = {
  INCOMPLETE: {
    label: 'Manifest incomplete',
    tone: 'border-[#e8d5ae] bg-[#fdf4e3] text-[#8a6d3b]',
  },
  IN_PROGRESS: {
    label: 'Manifest in progress',
    tone: 'border-[#e8d5ae] bg-[#fdf4e3] text-[#8a6d3b]',
  },
  SUBMITTED: {
    label: 'Manifest submitted',
    tone: 'border-[#bfe0d0] bg-[#eaf4ef] text-[#1f7a5c]',
  },
  APPROVED: {
    label: 'Manifest approved',
    tone: 'border-[#bfe0d0] bg-[#eaf4ef] text-[#1f7a5c]',
  },
};

const Fact = ({
  label,
  children,
  missing,
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
}) => (
  <div className="min-w-0">
    <span className="block text-[9.5px] font-medium tracking-[0.1em] text-manager-text-muted uppercase">
      {label}
    </span>
    <span
      className={cn(
        'mt-1 block text-sm tabular-nums',
        missing ? 'text-[#a49a91]' : 'text-manager-text',
      )}
    >
      {children}
    </span>
  </div>
);

/**
 * The stay, on the screen that decides things about it.
 *
 * Guest DNA answered everything about a guest's preferences and nothing about
 * why they were on it: no dates, no party size, no room. The list on the left
 * showed all three; the panel that opened when you clicked a name threw them
 * away in the mapper. Rodrigo had a Checkout button and no way to see whether
 * the guest had arrived.
 *
 * The same labelled-fact grid as the broker hold card, so the two screens in
 * this dashboard that answer "who, when, how many" answer it the same way.
 */
export const GuestStayBand = ({ profile }: { profile: GuestDNAProfile }) => {
  const stay = profile.stay;

  if (!stay) {
    return (
      <div className="border-b border-[#ebe6df] px-5 py-4 lg:px-6">
        <span className="block text-[10px] font-semibold tracking-[0.14em] text-manager-text-muted uppercase">
          This stay
        </span>
        <p className="mt-1.5 text-sm text-[#a49a91]">
          No current or upcoming stay. Their history is below.
        </p>
      </div>
    );
  }

  const manifest = MANIFEST[stay.manifestStatus];

  return (
    <div className="border-b border-[#ebe6df] px-5 py-4 lg:px-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-manager-text-muted uppercase">
          This stay
        </span>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
            manifest.tone,
          )}
        >
          {manifest.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        <Fact label="Arrival">{stayDateLong(stay.checkIn)}</Fact>
        <Fact label="Departure">{stayDateLong(stay.checkOut)}</Fact>
        <Fact label="Nights">{stay.nights}</Fact>
        <Fact label="Party">
          {stay.totalGuests} {stay.totalGuests === 1 ? 'guest' : 'guests'}
        </Fact>
        {/* A room the estate hasn't assigned yet says so. An empty cell here
            reads as a rendering fault, and this one is next to four facts
            that are always present. */}
        <Fact label="Room" missing={stay.roomNumber == null}>
          {stay.roomNumber == null ? 'Not assigned' : `Room ${stay.roomNumber}`}
        </Fact>
      </div>
    </div>
  );
};
