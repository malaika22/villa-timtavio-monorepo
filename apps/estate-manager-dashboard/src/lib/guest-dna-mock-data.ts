import type { GuestDNAProfile, GuestListItem } from '@/types';

export const guestListCurrent: GuestListItem[] = [
  {
    id: 'jm',
    name: 'J. Makarov',
    initials: 'JM',
    villa: 'Villa 3',
    dates: 'Mar 24 – Mar 31',
    partySize: 2,
    memberSince: '2024',
    status: 'Settled',
  },
  {
    id: 'ak',
    name: 'A. Khalil',
    initials: 'AK',
    villa: 'Villa 1',
    dates: 'Mar 27 – Mar 29',
    partySize: 4,
    memberSince: '2023',
    status: 'Settled',
  },
  {
    id: 'so',
    name: 'S. Okafor',
    initials: 'SO',
    villa: 'Villa 4',
    dates: 'Mar 25 – Mar 27',
    partySize: 2,
    status: 'Departing',
  },
  {
    id: 'rl',
    name: 'R. Lindqvist',
    initials: 'RL',
    villa: 'Villa 6',
    dates: 'Mar 26 – Mar 30',
    partySize: 3,
    memberSince: '2022',
    status: 'Settled',
  },
  {
    id: 'mf',
    name: 'Martinez Family',
    initials: 'MF',
    villa: 'Villa 4',
    dates: 'Mar 28 – Mar 31',
    partySize: 6,
    status: 'Arriving',
  },
];

export const guestListPast: GuestListItem[] = [
  {
    id: 'lb',
    name: 'L. Becker',
    initials: 'LB',
    villa: 'Villa 2',
    dates: 'Mar 18 – Mar 24',
    partySize: 2,
    status: 'Departed',
    isPast: true,
  },
  {
    id: 'so2',
    name: 'S. Okonkwo',
    initials: 'SO',
    villa: 'Villa 5',
    dates: 'Mar 10 – Mar 17',
    partySize: 4,
    status: 'Departed',
    isPast: true,
  },
];

export const guestDNAProfiles: Record<string, GuestDNAProfile> = {
  jm: {
    id: 'jm',
    name: 'J. Makarov',
    initials: 'JM',
    summary: 'Villa 3 · Mar 24–31 · Party of 2 · 4th visit',
    tags: ['Member', 'Estate Pass', 'Since 2023'],
    dietary: ['No shellfish', 'Gluten-free preferred', 'Organic produce only'],
    beverage: ['Burgundy red wine', 'San Pellegrino only', 'No ice in cocktails'],
    experiencePrefs: [
      'Oceanfront dining preferred',
      'Private chef for dinners',
      'Early morning activities',
    ],
    roomSetup: [
      { label: 'Pillows', value: 'Firm, 4 per bed' },
      { label: 'Temperature', value: '68°F at night' },
      { label: 'Flowers', value: 'White orchids only' },
      { label: 'Minibar', value: 'Vodka and red wine only' },
    ],
    staffNote: {
      text: 'Guest values privacy — prefers minimal staff interaction during villa hours. All dietary preferences must be confirmed with kitchen 24h before each meal. Has requested no photography during experiences.',
      author: 'Maria R.',
      date: 'Feb 12, 2026',
    },
    stayActivity: [
      {
        id: 'sa1',
        experience: "Chef's Table — Oceanfront",
        date: 'Mar 27',
        status: 'Conflict',
      },
      {
        id: 'sa2',
        experience: 'Private beach setup',
        date: 'Mar 26',
        status: 'Completed',
      },
      {
        id: 'sa3',
        experience: 'Estate wine tasting',
        date: 'Mar 25',
        status: 'Completed',
      },
      {
        id: 'sa4',
        experience: 'Helicopter tour',
        date: 'Mar 24',
        status: 'Completed',
      },
    ],
    stayHistory: [
      {
        id: 'sh1',
        visit: 'Mar 2026',
        isCurrent: true,
        villa: 'Villa 3',
        duration: '7 nights',
        experiences: '4',
        folioTotal: '$18,400',
      },
      {
        id: 'sh2',
        visit: 'Sep 2025',
        villa: 'Villa 3',
        duration: '10 nights',
        experiences: '6',
        folioTotal: '$42,150',
      },
      {
        id: 'sh3',
        visit: 'Mar 2025',
        villa: 'Villa 5',
        duration: '7 nights',
        experiences: '5',
        folioTotal: '$31,800',
      },
      {
        id: 'sh4',
        visit: 'Dec 2024',
        villa: 'Villa 3',
        duration: '5 nights',
        experiences: '3',
        folioTotal: '$22,400',
      },
    ],
  },
  ak: {
    id: 'ak',
    name: 'A. Khalil',
    initials: 'AK',
    summary: 'Villa 1 · Mar 27–29 · Party of 4 · 2nd visit',
    tags: ['Member', 'Since 2024'],
    dietary: ['Halal only', 'No pork'],
    beverage: ['Sparkling water', 'Espresso after meals'],
    experiencePrefs: ['Water sports', 'Family-friendly activities'],
    roomSetup: [
      { label: 'Pillows', value: 'Soft' },
      { label: 'Temperature', value: '70°F' },
    ],
    staffNote: {
      text: 'Traveling with two children — coordinate quieter villa zones after 8 PM.',
      author: 'Maria R.',
      date: 'Mar 20, 2026',
    },
    stayActivity: [
      {
        id: 'ak1',
        experience: 'Private Surf Lesson',
        date: 'Mar 27',
        status: 'Pending',
      },
      {
        id: 'ak2',
        experience: 'Helicopter Tour',
        date: 'Mar 28',
        status: 'Completed',
      },
    ],
    stayHistory: [
      {
        id: 'akh1',
        visit: 'Mar 2026',
        isCurrent: true,
        villa: 'Villa 1',
        duration: '2 nights',
        experiences: '2',
        folioTotal: '$8,200',
      },
    ],
  },
};

/** Default profile when list item has no full DNA record */
export function getGuestProfile(id: string, listItem: GuestListItem): GuestDNAProfile {
  const existing = guestDNAProfiles[id];
  if (existing) return existing;

  return {
    id: listItem.id,
    name: listItem.name,
    initials: listItem.initials,
    summary: `${listItem.villa} · ${listItem.dates} · Party of ${listItem.partySize}`,
    tags: listItem.memberSince ? ['Member'] : [],
    dietary: [],
    beverage: [],
    experiencePrefs: [],
    roomSetup: [],
    staffNote: {
      text: 'No staff notes on file for this guest.',
      author: 'Estate Team',
      date: '—',
    },
    stayActivity: [],
    stayHistory: [],
  };
}
