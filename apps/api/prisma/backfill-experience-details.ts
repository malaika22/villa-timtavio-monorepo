/**
 * One-off: fill experience detail fields (what's included, host, times,
 * capacity, price) with sensible dummy data where missing, so the guest
 * experience detail screen renders fully. Run after import-experiences.
 *
 * Run: npx tsx prisma/backfill-experience-details.ts
 */
import { PrismaClient, CatalogCategory } from '@prisma/client';

const prisma = new PrismaClient();

const HOST_BY_CATEGORY: Record<
  string,
  { name: string; title: string; avatar: string }
> = {
  CULINARY_AGAVE: {
    name: 'Chef Maria Lopez',
    title: 'Private Chef',
    avatar: 'https://images.unsplash.com/photo-1583394293214-28a5b42b3c1d?w=200&q=80',
  },
  WELLNESS: {
    name: 'Hikaru Tanaka',
    title: 'Wellness Practitioner',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80',
  },
  OCEAN_ADVENTURE: {
    name: 'Capt. Diego Marín',
    title: 'Marine Guide',
    avatar: 'https://images.unsplash.com/photo-1539701938214-0d9736e1c16b?w=200&q=80',
  },
  ARRIVAL_TRANSIT: {
    name: 'Estate Concierge',
    title: 'Guest Experience',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
  EXCURSIONS: {
    name: 'Luis Ramírez',
    title: 'Local Guide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  },
};

const DEFAULT_HOST = {
  name: 'Villa Concierge',
  title: 'Experience Host',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
};

const PRICE_BY_CATEGORY: Record<string, number> = {
  CULINARY_AGAVE: 450,
  WELLNESS: 280,
  OCEAN_ADVENTURE: 1200,
  ARRIVAL_TRANSIT: 350,
  EXCURSIONS: 600,
  PRIVATE: 500,
};

const INCLUDED = [
  'Full concierge coordination',
  'Premium materials & equipment',
  'Dedicated host throughout',
  'Setup & service by estate staff',
];

const TIME_SLOTS = ['09:00', '18:00', '20:00'];

async function main() {
  const items = await prisma.catalogItem.findMany();
  let updated = 0;

  for (const item of items) {
    const host = HOST_BY_CATEGORY[item.category] ?? DEFAULT_HOST;
    await prisma.catalogItem.update({
      where: { id: item.id },
      data: {
        included: item.included.length ? item.included : INCLUDED,
        hostName: item.hostName ?? host.name,
        hostTitle: item.hostTitle ?? host.title,
        hostAvatarUrl: item.hostAvatarUrl ?? host.avatar,
        hostReviewNote:
          item.hostReviewNote ?? 'Rated 4.9★ by recent villa guests.',
        availableTimeSlots: item.availableTimeSlots.length
          ? item.availableTimeSlots
          : TIME_SLOTS,
        maxGuestCount: item.maxGuestCount ?? 8,
        basePrice:
          item.basePrice ??
          PRICE_BY_CATEGORY[item.category] ??
          PRICE_BY_CATEGORY[CatalogCategory.PRIVATE],
      },
    });
    updated++;
  }

  console.log(`Backfilled ${updated} experiences`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
