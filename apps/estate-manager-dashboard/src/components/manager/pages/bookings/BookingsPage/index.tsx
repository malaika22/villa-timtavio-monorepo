'use client';

import { useState } from 'react';

import { BookingPreferencesCard } from '@/components/manager/pages/bookings/BookingPreferencesCard';
import { BookingsTabs } from '@/components/manager/pages/bookings/BookingsTabs';
import { CurrentBookingHero } from '@/components/manager/pages/bookings/CurrentBookingHero';
import { GuestManifestCard } from '@/components/manager/pages/bookings/GuestManifestCard';
import { PreArrivalChecklist } from '@/components/manager/pages/bookings/PreArrivalChecklist';
import { RequestedExperiencesCard } from '@/components/manager/pages/bookings/RequestedExperiencesCard';
import { currentBooking } from '@/lib/bookings-mock-data';
import type { BookingTab } from '@/types';

export const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState<BookingTab>('current');

  if (activeTab !== 'current') {
    return (
      <div className="space-y-5">
        <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <p className="rounded-lg border border-[#ebe6df] bg-white p-8 text-center text-sm text-manager-text-muted">
          {activeTab === 'upcoming' && 'Upcoming bookings will appear here.'}
          {activeTab === 'past' && 'Past bookings will appear here.'}
          {activeTab === 'manifest' && 'Manifest review queue will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <CurrentBookingHero booking={currentBooking} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GuestManifestCard booking={currentBooking} />
        <RequestedExperiencesCard booking={currentBooking} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingPreferencesCard booking={currentBooking} />
        <PreArrivalChecklist booking={currentBooking} />
      </div>
    </div>
  );
};
