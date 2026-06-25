// apps/api/prisma/seed.ts
import { PrismaClient, RoomType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Seed Rooms ────────────────────────────────────────────────────────────
  // These never change — seed once and leave alone

  const rooms = [
    {
      number: 1,
      name: 'King Master Suite',
      type: RoomType.KING_MASTER_SUITE,
      capacity: 2,
      bedConfig: 'King bed',
      beds: [{ type: 'king', count: 1 }],
      bathrooms: 1,
      ensuite: true,
      amenities: ['balcony', 'ac', 'ocean_view', 'walk_in_closet', 'smart_tv'],
      description:
        'Spacious primary suite with a private balcony overlooking the ocean and a generous walk-in closet.',
      imageUrl:
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
      floorLevel: 1,
    },
    {
      number: 2,
      name: 'King Master Suite',
      type: RoomType.KING_MASTER_SUITE,
      capacity: 2,
      bedConfig: 'King bed',
      beds: [{ type: 'king', count: 1 }],
      bathrooms: 1,
      ensuite: true,
      amenities: ['ac', 'pool_view', 'smart_tv', 'minibar'],
      description:
        'Elegant king suite facing the pool deck, with an ensuite bath and minibar.',
      imageUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
      floorLevel: 1,
    },
    {
      number: 3,
      name: 'Luxury Bunk Room',
      type: RoomType.LUXURY_BUNK_ROOM,
      capacity: 4,
      bedConfig: '1 Queen + 2 Twin bunks',
      beds: [
        { type: 'queen', count: 1 },
        { type: 'bunk', count: 1 },
      ],
      bathrooms: 1,
      ensuite: false,
      amenities: ['ac', 'smart_tv'],
      description:
        'Family-friendly room with a queen bed plus a twin bunk — ideal for kids or a small group.',
      imageUrl:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
      floorLevel: 1,
    },
    {
      number: 4,
      name: 'Luxury Bunk Room',
      type: RoomType.LUXURY_BUNK_ROOM,
      capacity: 4,
      bedConfig: '1 Queen + 2 Twin bunks',
      beds: [
        { type: 'queen', count: 1 },
        { type: 'bunk', count: 1 },
      ],
      bathrooms: 1,
      ensuite: false,
      amenities: ['ac', 'smart_tv', 'workspace'],
      description:
        'Versatile bunk room with a queen and a twin bunk, plus a quiet workspace nook.',
      imageUrl:
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900&q=80',
      floorLevel: 1,
    },
    {
      number: 5,
      name: 'King Master Suite',
      type: RoomType.KING_MASTER_SUITE,
      capacity: 2,
      bedConfig: 'King bed',
      beds: [{ type: 'king', count: 1 }],
      bathrooms: 1,
      ensuite: true,
      amenities: ['balcony', 'ac', 'ocean_view', 'smart_tv'],
      description:
        'Upper-floor king suite with a sunrise-facing balcony and ensuite bathroom.',
      imageUrl:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80',
      floorLevel: 2,
    },
    {
      number: 6,
      name: 'King Master Suite',
      type: RoomType.KING_MASTER_SUITE,
      capacity: 2,
      bedConfig: 'King bed',
      beds: [{ type: 'king', count: 1 }],
      bathrooms: 1,
      ensuite: true,
      amenities: ['ac', 'pool_view', 'walk_in_closet', 'smart_tv', 'minibar'],
      description:
        'Top-floor retreat overlooking the pool, with walk-in closet, minibar and ensuite bath.',
      imageUrl:
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80',
      floorLevel: 2,
    },
  ];

  for (const room of rooms) {
    const { beds, ...rest } = room;
    await prisma.room.upsert({
      where: { number: room.number },
      update: { ...rest, beds },
      create: { ...rest, beds },
    });
  }

  console.log('Seeded 6 rooms');

  // ─── Seed Included Services ────────────────────────────────────────────────

  const includedServices = [
    {
      name: '24hr Security',
      category: 'INCLUDED' as const,
      description:
        'Dedicated on-property security staff available around the clock.',
      shortDescription: 'On-property at all times.',
      isIncluded: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Dedicated Villa Service Staff',
      category: 'INCLUDED' as const,
      description: 'Personal service staff available 24 hours for every need.',
      shortDescription: 'Personal service, 24 hours.',
      isIncluded: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'All Meals',
      category: 'INCLUDED' as const,
      description:
        'Custom menus for breakfast, lunch, and dinner prepared daily by our culinary team using local ingredients.',
      shortDescription: 'Breakfast, lunch and dinner — custom menus daily.',
      isIncluded: true,
      isActive: true,
      availableTimeSlots: [
        'Breakfast · 8am',
        'Breakfast · 9am',
        'Lunch · 1pm',
        'Dinner · 7pm',
        'Dinner · 8pm',
      ],
      sortOrder: 3,
    },
    {
      name: 'All Beverages',
      category: 'INCLUDED' as const,
      description:
        'Full beverage service including bespoke agave cocktails, wine, spirits, and non-alcoholic options. 24hr snacks available.',
      shortDescription: 'Agave, cocktails, wine and 24hr snacks.',
      isIncluded: true,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Daily Turndown Service',
      category: 'INCLUDED' as const,
      description:
        'Nightly turndown service with fresh linens, ambient lighting, and evening amenities.',
      shortDescription: 'Every evening.',
      isIncluded: true,
      isActive: true,
      availableTimeSlots: ['Evening · 7pm', 'Evening · 8pm', 'Evening · 9pm'],
      sortOrder: 5,
    },
    {
      name: 'The Grand Entrance Experience',
      category: 'INCLUDED' as const,
      description:
        'A curated welcome arrival experience designed to introduce you to the estate and set the tone for your stay.',
      shortDescription: 'Your arrival, elevated.',
      isIncluded: true,
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const service of includedServices) {
    await prisma.catalogItem.create({ data: service });
  }

  console.log('Seeded 6 included services');

  // ─── Seed Add-On Experiences ───────────────────────────────────────────────

  const addOnExperiences = [
    // Arrival + Transit
    {
      name: 'Private Jet / Flight Coordination',
      category: 'ARRIVAL_TRANSIT' as const,
      description:
        'Seamless private aviation coordination from your departure city directly to Puerto Escondido.',
      shortDescription: 'Private aviation arranged door to door.',
      isIncluded: false,
      isActive: true,
      sortOrder: 10,
    },
    {
      name: 'Private Black Car Service',
      category: 'ARRIVAL_TRANSIT' as const,
      description:
        'Luxury ground transportation from the airport to the estate.',
      shortDescription: 'Chauffeured arrival to the estate.',
      isIncluded: false,
      isActive: true,
      sortOrder: 11,
    },
    // Wellness
    {
      name: 'Massages',
      category: 'WELLNESS' as const,
      description:
        'Therapeutic massage sessions on the estate with certified therapists. Choose from Swedish, deep tissue, or traditional techniques.',
      shortDescription: 'On-estate therapeutic massage.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 90,
      durationLabel: '90 min',
      availableTimeSlots: [
        'Morning · 9am',
        'Afternoon · 2pm',
        'Afternoon · 4pm',
      ],
      setupLeadTimeMinutes: 30,
      sortOrder: 20,
    },
    {
      name: 'Private Yoga Sessions',
      category: 'WELLNESS' as const,
      description:
        'One-on-one or group yoga sessions on the estate terrace with ocean views.',
      shortDescription: 'Private instruction with ocean views.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 60,
      durationLabel: '60 min',
      availableTimeSlots: [
        'Sunrise · 6:30am',
        'Morning · 8am',
        'Morning · 9am',
      ],
      setupLeadTimeMinutes: 20,
      sortOrder: 21,
    },
    {
      name: 'Guided Wellness Ceremonies',
      category: 'WELLNESS' as const,
      description:
        'Guided ceremonial wellness experiences curated for reflection, connection, and restoration.',
      shortDescription: 'Guided ceremonial experience.',
      isIncluded: false,
      isActive: true,
      availableTimeSlots: ['Evening · 6pm', 'Evening · 7pm'],
      setupLeadTimeMinutes: 60,
      sortOrder: 22,
    },
    // Culinary + Agave
    {
      name: 'Private Cooking Class',
      category: 'CULINARY_AGAVE' as const,
      description:
        'Hands-on cooking class with our resident chef featuring local ingredients and traditional Mexican techniques.',
      shortDescription: 'Cook with the chef, eat what you make.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 180,
      durationLabel: '3 hrs',
      availableTimeSlots: ['Morning · 10am', 'Afternoon · 3pm'],
      setupLeadTimeMinutes: 60,
      sortOrder: 30,
    },
    {
      name: 'Cocktail Masterclass',
      category: 'CULINARY_AGAVE' as const,
      description:
        'Learn the craft of agave-based cocktails with our resident mixologist. From mezcal negronis to traditional tejate.',
      shortDescription: 'Master agave cocktails with our mixologist.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 90,
      durationLabel: '90 min',
      availableTimeSlots: ['Afternoon · 4pm', 'Sunset · 6pm'],
      setupLeadTimeMinutes: 45,
      sortOrder: 31,
    },
    {
      name: 'In-House Mezcal Tasting',
      category: 'CULINARY_AGAVE' as const,
      description:
        'Curated tasting of rare artisanal mezcals guided by a certified sommelier.',
      shortDescription: 'Rare artisanal mezcals, guided.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 90,
      durationLabel: '90 min',
      availableTimeSlots: ['Afternoon · 4pm', 'Sunset · 6pm', 'Evening · 7pm'],
      setupLeadTimeMinutes: 30,
      sortOrder: 32,
    },
    {
      name: 'Private Mezcal Farm Tour',
      category: 'CULINARY_AGAVE' as const,
      description:
        'Full-day visit to an artisanal mezcal farm in the Oaxacan highlands. Meet the maestro, see the distillation process, taste directly from the still.',
      shortDescription: 'Full-day farm visit in the highlands.',
      isIncluded: false,
      isActive: true,
      durationLabel: 'Full day',
      availableTimeSlots: ['Morning departure · 8am'],
      setupLeadTimeMinutes: 120,
      sortOrder: 33,
    },
    // Ocean + Adventure
    {
      name: 'Private Turtle Releases',
      category: 'OCEAN_ADVENTURE' as const,
      description:
        'Participate in the seasonal sea turtle release program on Playa Escondida. A rare and profound experience.',
      shortDescription: 'Seasonal sea turtle release experience.',
      isIncluded: false,
      isActive: true,
      durationLabel: '2 hrs',
      durationMinutes: 120,
      availableTimeSlots: ['Sunrise · 5:30am'],
      setupLeadTimeMinutes: 30,
      sortOrder: 40,
    },
    {
      name: 'Surfing Excursions',
      category: 'OCEAN_ADVENTURE' as const,
      description:
        "Guided surf sessions at Puerto Escondido's world-class waves. Suitable for all levels — from first-timers to advanced surfers.",
      shortDescription: 'World-class waves, all levels welcome.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 120,
      durationLabel: '2 hrs',
      availableTimeSlots: ['Dawn · 6am', 'Morning · 8am', 'Morning · 10am'],
      setupLeadTimeMinutes: 30,
      sortOrder: 41,
    },
    {
      name: 'ATV Rentals',
      category: 'OCEAN_ADVENTURE' as const,
      description:
        'Explore the coastal terrain and jungle tracks surrounding the estate by ATV.',
      shortDescription: 'Coastal terrain exploration by ATV.',
      isIncluded: false,
      isActive: true,
      durationLabel: 'Half day',
      availableTimeSlots: ['Morning · 9am', 'Afternoon · 2pm'],
      setupLeadTimeMinutes: 45,
      sortOrder: 42,
    },
    {
      name: 'Sunset Horseback Riding',
      category: 'OCEAN_ADVENTURE' as const,
      description:
        'Guided sunset ride along the beach and through the palm groves with experienced local guides.',
      shortDescription: 'Sunset beach ride with local guides.',
      isIncluded: false,
      isActive: true,
      durationMinutes: 90,
      durationLabel: '90 min',
      availableTimeSlots: ['Sunset · 5:30pm', 'Sunset · 6pm'],
      setupLeadTimeMinutes: 60,
      sortOrder: 43,
    },
    // Excursions
    {
      name: 'Oaxaca Centro Day Trip',
      category: 'EXCURSIONS' as const,
      description:
        'Curated full-day guided excursion into Oaxaca city. Markets, mezcal, architecture, street food, and culture — all personally guided.',
      shortDescription: 'Full-day guided Oaxaca city experience.',
      isIncluded: false,
      isActive: true,
      durationLabel: 'Full day',
      availableTimeSlots: ['Morning departure · 7am'],
      setupLeadTimeMinutes: 120,
      sortOrder: 50,
    },
    {
      name: 'Oaxaca 2-Night Immersion',
      category: 'EXCURSIONS' as const,
      description:
        'An extended 2-night cultural immersion into Oaxaca city. Boutique hotel stay, curated culinary experiences, mezcal trails, artisan villages, and private gallery access.',
      shortDescription: '2-night cultural deep-dive into Oaxaca.',
      isIncluded: false,
      isActive: true,
      isMultiDay: true,
      multiDayDuration: 2,
      durationLabel: '2 nights',
      availableTimeSlots: ['Morning departure · 7am'],
      setupLeadTimeMinutes: 240,
      sortOrder: 51,
    },
  ];

  for (const experience of addOnExperiences) {
    await prisma.catalogItem.create({ data: experience });
  }

  console.log(`Seeded ${addOnExperiences.length} add-on experiences`);

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
