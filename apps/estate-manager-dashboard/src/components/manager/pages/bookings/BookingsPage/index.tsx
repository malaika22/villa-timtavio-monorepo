'use client';

import { useState } from 'react';

import { BookingPreferencesCard } from '@/components/manager/pages/bookings/BookingPreferencesCard';
import { BookingsTabs } from '@/components/manager/pages/bookings/BookingsTabs';
import { CurrentBookingHero } from '@/components/manager/pages/bookings/CurrentBookingHero';
import { GuestManifestCard } from '@/components/manager/pages/bookings/GuestManifestCard';
import { PreArrivalChecklist } from '@/components/manager/pages/bookings/PreArrivalChecklist';
import { RequestedExperiencesCard } from '@/components/manager/pages/bookings/RequestedExperiencesCard';
import { DiningSittingsCard } from '@/components/manager/pages/bookings/DiningSittingsCard';
import { BookingsListTab } from '@/components/manager/pages/bookings/BookingsListTab';
import { mapToCurrentBooking } from '@/lib/mappers/booking';
import type { BookingTab } from '@/types';
import { useCurrentActiveBooking } from '@/hooks/useBookings';
import {
  useUpcomingGuests,
  useCurrentGuestsRaw,
  usePastGuests,
} from '@/hooks/useGuests';
import { useManifest } from '@/hooks/useManifest';

const EmptyState = ({ message }: { message: string }) => (
  <p className="rounded-lg border border-[#ebe6df] bg-white p-8 text-center text-sm text-manager-text-muted">
    {message}
  </p>
);

export const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState<BookingTab>('current');

  const { data: detail, isLoading } = useCurrentActiveBooking();
  const { data: manifest } = useManifest(detail?.id ?? null);
  const upcoming = useUpcomingGuests();
  const currentRaw = useCurrentGuestsRaw();
  const past = usePastGuests();

  if (activeTab === 'upcoming') {
    return (
      <div className="space-y-5">
        <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <BookingsListTab
          guests={upcoming.data ?? []}
          isLoading={upcoming.isLoading}
          mode="upcoming"
        />
      </div>
    );
  }

  if (activeTab === 'manifest') {
    return (
      <div className="space-y-5">
        <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <BookingsListTab
          guests={currentRaw.data ?? []}
          isLoading={currentRaw.isLoading}
          mode="manifest-review"
        />
      </div>
    );
  }

  if (activeTab === 'past') {
    return (
      <div className="space-y-5">
        <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="overflow-hidden rounded-xl border border-[#ebe6df] bg-white">
          {past.isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded bg-manager-border"
                />
              ))}
            </div>
          ) : (past.data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-manager-text-muted">
              No past bookings yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#ebe6df] bg-[#faf9f7] text-left text-xs uppercase tracking-wide text-manager-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(past.data ?? []).map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-[#f1ece4] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-manager-text">
                      {g.name}
                    </td>
                    <td className="px-4 py-3 text-manager-text-muted">
                      {g.dates}
                    </td>
                    <td className="px-4 py-3 text-manager-text-muted">
                      {g.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  const booking = detail ? mapToCurrentBooking(detail) : null;

  return (
    <div className="space-y-6">
      <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-xl bg-manager-border" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
            <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
          </div>
        </div>
      ) : !booking ? (
        <EmptyState message="No active booking right now. The current stay will appear here once a booking is checked in or upcoming." />
      ) : (
        <>
          <CurrentBookingHero booking={booking} />

          <div id="manifest" className="grid scroll-mt-6 gap-6 lg:grid-cols-2">
            <GuestManifestCard bookingId={booking.id} manifest={manifest} />
            <RequestedExperiencesCard booking={booking} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BookingPreferencesCard booking={booking} />
            <PreArrivalChecklist booking={booking} />
          </div>

          <DiningSittingsCard bookingId={booking.id} />
        </>
      )}
    </div>
  );
};
