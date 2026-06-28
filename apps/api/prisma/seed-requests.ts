/**
 * One-off: seed a few experience requests so the Approvals queue has data.
 * Run: npx tsx prisma/seed-requests.ts
 */
import { PrismaClient, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Prefer the currently checked-in booking; else the most recent.
  const booking =
    (await prisma.booking.findFirst({
      where: { status: 'CHECKED_IN' },
      include: { primaryGuest: true },
      orderBy: { checkIn: 'desc' },
    })) ??
    (await prisma.booking.findFirst({
      include: { primaryGuest: true },
      orderBy: { checkIn: 'desc' },
    }));

  if (!booking) {
    console.log('No booking found — seed bookings first.');
    return;
  }

  const items = await prisma.catalogItem.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { sortOrder: 'asc' },
  });
  if (items.length < 4) {
    console.log('Not enough catalog items — import experiences first.');
    return;
  }

  // Clear existing requests for a clean queue (ratings reference requests).
  await prisma.vendorRating.deleteMany({});
  await prisma.experienceRequest.deleteMany({});

  const now = new Date();
  const inDays = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const guest = booking.primaryGuest;
  const base = {
    bookingId: booking.id,
    requestedByEmail: guest.email,
    requestedByName: `${guest.firstName} ${guest.lastName}`,
    guestTier: 'PRIMARY' as const,
    preferredTime: '18:00',
    guestCount: 4,
    requiresPrimaryApproval: false,
    primaryApproved: true,
  };

  const rows: {
    catalogItemId: string;
    status: RequestStatus;
    preferredDate: Date;
    preferredTime: string;
  }[] = [
    { catalogItemId: items[0]!.id, status: 'PENDING', preferredDate: inDays(2), preferredTime: '12:00' },
    { catalogItemId: items[1]!.id, status: 'PENDING', preferredDate: inDays(3), preferredTime: '19:30' },
    { catalogItemId: items[2]!.id, status: 'CONFLICT', preferredDate: inDays(2), preferredTime: '19:30' },
    { catalogItemId: items[3]!.id, status: 'CONFIRMED', preferredDate: inDays(1), preferredTime: '20:00' },
    { catalogItemId: items[4]?.id ?? items[0]!.id, status: 'IN_PROGRESS', preferredDate: now, preferredTime: '09:00' },
  ];

  for (const r of rows) {
    await prisma.experienceRequest.create({
      data: {
        ...base,
        catalogItemId: r.catalogItemId,
        status: r.status,
        preferredDate: r.preferredDate,
        preferredTime: r.preferredTime,
      },
    });
  }

  // ─── Secondary-guest paid requests requiring primary approval ─────────────
  // These power the PWA /approvals screen (pending) and the EM Declined tab.
  const paidItems = await prisma.catalogItem.findMany({
    where: { isActive: true, isIncluded: false, basePrice: { not: null } },
    take: 3,
    orderBy: { basePrice: 'desc' },
  });

  // Attribute to an existing secondary manifest guest, else fall back to a stub.
  const secondaryGuest = await prisma.manifestGuest.findFirst({
    where: { bookingId: booking.id, NOT: { email: guest.email } },
    orderBy: { createdAt: 'asc' },
  });
  const secondary = secondaryGuest
    ? {
        email: secondaryGuest.email,
        name: `${secondaryGuest.firstName} ${secondaryGuest.lastName}`,
      }
    : { email: 'guest.secondary@example.com', name: 'Alex Rivera' };

  if (paidItems.length === 0) {
    console.log(
      'No paid (non-included) catalog items found — skipping secondary approval seed.',
    );
  } else {
    const secondaryBase = {
      bookingId: booking.id,
      requestedByEmail: secondary.email,
      requestedByName: secondary.name,
      guestTier: 'SECONDARY' as const,
      guestCount: 2,
      requiresPrimaryApproval: true,
    };

    // Two awaiting the primary's decision.
    for (let i = 0; i < Math.min(2, paidItems.length); i++) {
      await prisma.experienceRequest.create({
        data: {
          ...secondaryBase,
          catalogItemId: paidItems[i]!.id,
          status: 'PENDING',
          primaryApproved: false,
          preferredDate: inDays(2 + i),
          preferredTime: i === 0 ? '17:00' : '11:00',
          specialRequests:
            i === 0 ? 'Celebrating an anniversary — sunset preferred.' : undefined,
        },
      });
    }

    // One the primary already declined (shows reason to secondary + EM).
    await prisma.experienceRequest.create({
      data: {
        ...secondaryBase,
        catalogItemId: paidItems[paidItems.length - 1]!.id,
        status: 'CANCELLED',
        primaryApproved: false,
        preferredDate: inDays(4),
        preferredTime: '20:00',
        declineReason:
          'Already booked the group dinner that evening — let’s skip this one.',
      },
    });

    console.log(
      `Seeded ${Math.min(2, paidItems.length)} pending + 1 declined secondary request(s) for ${secondary.name}`,
    );
  }

  console.log(`Seeded ${rows.length} experience requests for booking ${booking.id}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
