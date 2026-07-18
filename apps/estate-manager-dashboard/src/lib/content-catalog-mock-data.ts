import type {
  ContentCatalogTab,
  ContentExperience,
  ContentExperienceCategory,
} from '@/types';

export const contentCatalogTabCounts: Record<ContentCatalogTab, number> = {
  experiences: 9,
  menus: 24,
  recommendations: 11,
};

export const contentExperienceFilters: {
  value: 'all' | ContentExperienceCategory;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'dining', label: 'Dining' },
  { value: 'water', label: 'Water' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'wine', label: 'Wine' },
  { value: 'culture', label: 'Culture' },
];

export const contentExperiences: ContentExperience[] = [
  {
    id: 'exp-chef',
    name: "Chef's Table",
    category: 'dining',
    categoryLabel: 'DINING',
    pricing: 'chargeable',
    active: true,
    capacity: 'Up to 10 pax',
    duration: '2 hrs',
    imageTone: 'dining',
  },
  {
    id: 'exp-pool',
    name: 'Pool Exclusive · Sunset',
    category: 'water',
    categoryLabel: 'WATER',
    pricing: 'included',
    active: true,
    capacity: 'Up to 12 pax',
    duration: '2 hrs',
    imageTone: 'water',
  },
  {
    id: 'exp-spa',
    name: 'Spa & Wellness Session',
    category: 'wellness',
    categoryLabel: 'WELLNESS',
    pricing: 'chargeable',
    active: true,
    capacity: 'Up to 4 pax',
    duration: '90 min',
    imageTone: 'wellness',
  },
  {
    id: 'exp-surf',
    name: 'Surf Lesson',
    category: 'water',
    categoryLabel: 'WATER',
    pricing: 'chargeable',
    active: true,
    capacity: 'Up to 8 pax',
    duration: 'Requires 48h notice',
    imageTone: 'water',
  },
  {
    id: 'exp-wine',
    name: 'Wine Vault Tasting',
    category: 'wine',
    categoryLabel: 'WINE',
    pricing: 'chargeable',
    active: true,
    capacity: 'Up to 6 pax',
    duration: '90 min',
    imageTone: 'wine',
  },
  {
    id: 'exp-yoga',
    name: 'Sunrise Yoga',
    category: 'wellness',
    categoryLabel: 'WELLNESS',
    pricing: 'included',
    active: true,
    capacity: 'Up to 10 pax',
    duration: '1 hr',
    imageTone: 'wellness',
  },
  {
    id: 'exp-cinema',
    name: 'Private Cinema Night',
    category: 'culture',
    categoryLabel: 'CULTURE',
    pricing: 'included',
    active: true,
    capacity: 'Up to 14 pax',
    duration: '3 hrs',
    imageTone: 'culture',
  },
  {
    id: 'exp-fishing',
    name: 'Deep Sea Fishing',
    category: 'water',
    categoryLabel: 'WATER',
    pricing: 'chargeable',
    active: false,
    capacity: 'Up to 6 pax',
    duration: '4 hrs',
    imageTone: 'inactive',
  },
];
