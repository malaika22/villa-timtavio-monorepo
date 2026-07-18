import type { CurrentBooking } from '@/types';

export const currentBooking: CurrentBooking = {
  id: 'b1',
  guestName: 'J. Makarov',
  initials: 'JM',
  dates: '14–21 May 2026',
  nights: 7,
  guests: 8,
  rooms: 6,
  arrivesIn: 'Arrives in 6 days',
  tags: ['Party of 8', 'Member', 'Estate Pass', '4th visit', 'All 6 rooms'],
  status: 'Confirmed',
  manifestAlert:
    'Guest manifest submitted — 8 guests, 6 rooms. Awaiting your review before check-in.',
  roomsManifest: [
    { id: 'r1', label: 'Room 1', guestCount: 2 },
    { id: 'r2', label: 'Room 2', guestCount: 2 },
    { id: 'r3', label: 'Room 3', guestCount: 1 },
    { id: 'r4', label: 'Room 4', guestCount: 1 },
    { id: 'r5', label: 'Room 5', guestCount: 1 },
    { id: 'r6', label: 'Room 6', guestCount: 1 },
  ],
  manifestProgress: { added: 8, total: 8 },
  experiences: [
    {
      id: 'e1',
      name: "Chef's Table (8 pax)",
      date: 'May 16',
      status: 'Pending',
    },
    {
      id: 'e2',
      name: 'Pool Exclusive — Sunset',
      date: 'May 17',
      status: 'Pending',
    },
    {
      id: 'e3',
      name: 'Wine Vault Tasting',
      date: 'May 19',
      status: 'Complimentary',
    },
    {
      id: 'e4',
      name: 'Surf Lesson (4 pax)',
      date: 'May 20',
      status: 'Confirmed',
    },
  ],
  dietary: ['No shellfish', 'Lactose-free', 'Nut allergy — moderate'],
  dietaryAlert: 'Nut allergy — moderate',
  beverages: ['Burgundy red', 'Still water — chilled', 'Mezcal negroni'],
  roomSetup: 'Firm pillows · 4 per bed · 68°F at night · White orchids only',
  staffNote: {
    text: 'Guest values privacy — prefers minimal staff interaction during villa hours. All dietary preferences must be confirmed with kitchen 24h before each meal. Nut allergy is moderate severity.',
    attribution: 'Staff note · Added by Maria R. · Apr 28, 2026',
  },
  checklist: [
    {
      id: 'c1',
      title: 'Booking confirmed',
      detail: 'Lodgify · Apr 10',
      status: 'completed',
    },
    {
      id: 'c2',
      title: 'Magic link sent',
      detail: 'Apr 12',
      status: 'completed',
    },
    {
      id: 'c3',
      title: 'Guest manifest submitted',
      detail: '8 guests · Apr 28',
      status: 'completed',
    },
    {
      id: 'c4',
      title: 'Manifest review',
      detail: 'Pending · Due before May 14',
      status: 'pending',
    },
    {
      id: 'c5',
      title: 'Room preparation',
      detail: 'Due May 13',
      status: 'upcoming',
    },
    {
      id: 'c6',
      title: 'Guest check-in',
      detail: 'May 14',
      status: 'upcoming',
    },
  ],
};
