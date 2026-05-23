import { ExperienceStatus } from '@/types/experienceStatus';
import type {
  Experience,
  ExperienceDetailData,
  ExperienceFilterId,
} from '@/types/experience';

/**
 * Full catalog for /experiences. Featured section uses the first two entries.
 */
export const EXPERIENCES_MOCK_DATA: Experience[] = [
  {
    id: 1,
    category: 'Culinary',
    filterCategory: 'culinary',
    title: "Chef's Table Dinner",
    experienceHours: 3,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 2,
    category: 'Water',
    filterCategory: 'water',
    title: 'Pool Exclusive',
    experienceHours: 3,
    image: '/images/experience.png',
    status: ExperienceStatus.IN_PROGRESS,
  },
  {
    id: 3,
    category: 'Private',
    filterCategory: 'private',
    title: 'Private Spa Ritual',
    durationMinutes: 90,
    image: '/images/experience.png',
    status: ExperienceStatus.LOCKED_PRE_ARRIVAL,
  },
  {
    id: 4,
    category: 'Adventure',
    filterCategory: 'adventure',
    title: 'Surf Session',
    experienceHours: 2,
    image: '/images/experience.png',
    status: ExperienceStatus.COMPLETED,
  },
  {
    id: 5,
    category: 'Wellness',
    filterCategory: 'wellness',
    title: 'Sunrise Yoga Deck',
    experienceHours: 1,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 6,
    category: 'Culinary',
    filterCategory: 'culinary',
    title: 'Wine & Olive Oil Tasting',
    experienceHours: 2,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 7,
    category: 'Water',
    filterCategory: 'water',
    title: 'Coastal Sail',
    experienceHours: 4,
    image: '/images/experience.png',
    status: ExperienceStatus.PENDING,
  },
  {
    id: 8,
    category: 'Private',
    filterCategory: 'private',
    title: 'Villa Cinema Night',
    experienceHours: 3,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 9,
    category: 'Wellness',
    filterCategory: 'wellness',
    title: 'Thermal Circuit',
    durationMinutes: 90,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 10,
    category: 'Adventure',
    filterCategory: 'adventure',
    title: 'Hiking & Picnic',
    experienceHours: 5,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 11,
    category: 'Culinary',
    filterCategory: 'culinary',
    title: 'Market Walk & Lunch',
    experienceHours: 4,
    image: '/images/experience.png',
    status: ExperienceStatus.CONFIRMED,
  },
  {
    id: 12,
    category: 'Water',
    filterCategory: 'water',
    title: 'Kayak Cove',
    experienceHours: 2,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 13,
    category: 'Private',
    filterCategory: 'private',
    title: 'Chef at Villa',
    experienceHours: 4,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 14,
    category: 'Wellness',
    filterCategory: 'wellness',
    title: 'Sound Bath',
    durationMinutes: 60,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
  {
    id: 15,
    category: 'Adventure',
    filterCategory: 'adventure',
    title: 'E-bike Countryside',
    experienceHours: 3,
    image: '/images/experience.png',
    status: ExperienceStatus.COMPLETED,
  },
  {
    id: 16,
    category: 'Culinary',
    filterCategory: 'culinary',
    title: 'Sunset Aperitivo',
    experienceHours: 1,
    image: '/images/experience.png',
    status: ExperienceStatus.AVAILABLE,
  },
];

export const FEATURED_EXPERIENCES_MOCK_DATA: Experience[] =
  EXPERIENCES_MOCK_DATA.slice(0, 2);

export const EXPERIENCE_FILTER_CHIPS: {
  id: ExperienceFilterId;
  label: string;
}[] = [
  { id: 'all', label: 'ALL' },
  { id: 'water', label: 'WATER' },
  { id: 'culinary', label: 'CULINARY' },
  { id: 'wellness', label: 'WELLNESS' },
  { id: 'private', label: 'PRIVATE' },
  { id: 'adventure', label: 'ADVENTURE' },
];

/** Fallback detail used when an experience has no bespoke record. */
export const DEFAULT_EXPERIENCE_DETAIL: ExperienceDetailData = {
  about: 'An exclusive experience curated for villa guests.',
  included: [
    'Full concierge coordination',
    'Premium materials & equipment',
    'Dedicated host throughout',
  ],
  basePrice: 0,
  priceUnit: 'per villa',
};

export const EXPERIENCE_DETAIL_DATA: Record<number, ExperienceDetailData> = {
  1: {
    images: [
      '/images/experience.png',
      '/images/experience.png',
      '/images/experience.png',
    ],
    about:
      "A private multi-course dining experience designed around the estate's garden and the morning's catch.",
    longDescription:
      'Chef Billy personally crafts each menu the morning of your dinner. No printed menu — just conversation and cuisine.',
    included: [
      '8-course tasting menu',
      'Wine pairing from private cellar',
      'Setup & service by estate staff',
    ],
    host: {
      name: 'Chef Billy',
      role: 'Private Chef',
      category: 'Culinary',
      avatar: '/images/experience.png',
      reviewNote:
        '"You\'ve dined with Chef Billy twice before · 4.9★ from your visits."',
    },
    availableDate: '26TH MARCH',
    availableTimes: [
      { id: 'morning', label: 'Morning', time: '9am' },
      { id: 'sunset', label: 'Sunset', time: '6pm' },
      { id: 'evening', label: 'Evening', time: '8pm', disabled: true },
    ],
    maxGuests: 8,
    basePrice: 450,
    priceUnit: 'per villa',
  },
  2: {
    images: ['/images/experience.png', '/images/experience.png'],
    about:
      "An exclusive full-day reservation of the villa's private infinity pool with personalized poolside service.",
    longDescription:
      'Your own private oasis — no shared access, full concierge attention, and all the extras you would expect.',
    included: [
      'Full-day pool exclusivity',
      'Poolside towels & amenities',
      'Chilled beverages & light bites',
    ],
    availableDate: '26TH MARCH',
    availableTimes: [
      { id: 'morning', label: 'Morning', time: '9am' },
      { id: 'afternoon', label: 'Afternoon', time: '2pm' },
    ],
    maxGuests: 6,
    basePrice: 300,
    priceUnit: 'per villa',
  },
  3: {
    images: ['/images/experience.png', '/images/experience.png'],
    about:
      "A deeply restorative 90-minute ritual blending hot stone therapy, aromatic oils, and breathwork in the villa's private spa suite.",
    longDescription:
      'Designed to decompress from travel and ease into the villa rhythm. Available exclusively to villa guests.',
    included: [
      '90-min signature massage',
      'Aromatherapy & hot stones',
      'Post-treatment herbal tea service',
    ],
    maxGuests: 2,
    basePrice: 280,
    priceUnit: 'per person',
  },
  4: {
    images: ['/images/experience.png', '/images/experience.png'],
    about:
      "A guided surf lesson at the estate's private beach cove with an experienced local instructor.",
    longDescription:
      'Perfect for first-timers and intermediates alike. All equipment is provided and the session is fully private.',
    included: [
      'Surfboard & wetsuit rental',
      'Private instructor (2 hrs)',
      'Post-session beach snacks',
    ],
    host: {
      name: 'Marco Reyes',
      role: 'Surf Instructor',
      category: 'Adventure',
      avatar: '/images/experience.png',
      reviewNote:
        '"You completed this experience on your last visit · 4.7★ from your feedback."',
    },
    availableDate: '27TH MARCH',
    availableTimes: [
      { id: 'dawn', label: 'Dawn', time: '7am' },
      { id: 'morning', label: 'Morning', time: '10am' },
    ],
    maxGuests: 4,
    basePrice: 195,
    priceUnit: 'per villa',
  },
  5: {
    images: ['/images/experience.png', '/images/experience.png'],
    about:
      'A slow, mindful yoga session on the open-air rooftop deck as the sun rises over the coastline.',
    longDescription:
      'Led by a resident yoga guide, this session blends asana, pranayama, and stillness — setting the tone for the day.',
    included: [
      'Guided 60-min practice',
      'Mats, blocks & straps provided',
      'Morning tea & fruit after class',
    ],
    availableDate: '26TH MARCH',
    availableTimes: [
      { id: 'sunrise', label: 'Sunrise', time: '6am' },
      { id: 'morning', label: 'Morning', time: '8am' },
    ],
    maxGuests: 6,
    basePrice: 85,
    priceUnit: 'per villa',
  },
  6: {
    images: ['/images/experience.png', '/images/experience.png'],
    about:
      "A curated tasting journey through the estate's award-winning wine cellar and hand-pressed olive oil collection.",
    longDescription:
      'Hosted by the estate sommelier, who pairs each varietal with a story from the land.',
    included: [
      'Wine & olive oil tasting (6 pours)',
      'Artisan cheese & charcuterie board',
      'Take-home bottle of estate olive oil',
    ],
    availableDate: '26TH MARCH',
    availableTimes: [
      { id: 'afternoon', label: 'Afternoon', time: '3pm' },
      { id: 'evening', label: 'Evening', time: '6pm' },
    ],
    maxGuests: 8,
    basePrice: 120,
    priceUnit: 'per villa',
  },
};
