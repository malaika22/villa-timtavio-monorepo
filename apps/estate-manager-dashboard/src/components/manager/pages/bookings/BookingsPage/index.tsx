'use client';

import { useState } from 'react';

import { BookingPreferencesCard } from '@/components/manager/pages/bookings/BookingPreferencesCard';
import { BookingsTabs } from '@/components/manager/pages/bookings/BookingsTabs';
import { CurrentBookingHero } from '@/components/manager/pages/bookings/CurrentBookingHero';
import { GuestManifestCard } from '@/components/manager/pages/bookings/GuestManifestCard';
import { PreArrivalChecklist } from '@/components/manager/pages/bookings/PreArrivalChecklist';
import { RequestedExperiencesCard } from '@/components/manager/pages/bookings/RequestedExperiencesCard';
import { DiningSittingsCard } from '@/components/manager/pages/bookings/DiningSittingsCard';
import { mapToCurrentBooking } from '@/lib/mappers/booking';
import type { BookingTab } from '@/types';
import { useCurrentActiveBooking } from '@/hooks/useBookings';
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

  if (activeTab !== 'current') {
    return (
      <div className="space-y-5">
        <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <EmptyState
          message={
            activeTab === 'upcoming'
              ? 'Upcoming bookings will appear here once synced from Lodgify.'
              : activeTab === 'past'
                ? 'Past bookings will appear here.'
                : 'The manifest review queue will appear here.'
          }
        />
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

          <div className="grid gap-6 lg:grid-cols-2">
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
