#!/usr/bin/env node
/**
 * Removes named test records before the estate starts taking real guests.
 *
 * Two independent jobs, either of which can be skipped:
 *
 *   - a guest and everything hanging off their stays
 *   - inquiries, by email address
 *
 *   node /app/apps/api/scripts/purge-test-data.js                    # dry run
 *   node /app/apps/api/scripts/purge-test-data.js --apply
 *   node /app/apps/api/scripts/purge-test-data.js --guests-only
 *   node /app/apps/api/scripts/purge-test-data.js --inquiries-only
 *
 * Dry by default, and the dry run prints a row count for every table it would
 * touch. This deletes permanently — there is no cancelled-but-recoverable
 * state here the way there is for a booking — so the list you read before
 * typing --apply is the only chance to notice it naming something real.
 *
 * On the order of deletion: three tables cascade from Booking on their own
 * (ManifestGuest, MenuSelection and its items, ManifestDraft). Seven more
 * point at it with a required foreign key and have to be cleared by hand
 * first, or Postgres refuses the delete. Four hold it optionally and are
 * nulled instead of removed — including AuditLog, which is the record of what
 * the estate did and is worth keeping even when its booking is not. Those
 * rows keep their entityId, so the trail survives the guest.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const GUESTS_ONLY = process.argv.includes('--guests-only');
const INQUIRIES_ONLY = process.argv.includes('--inquiries-only');

/** Matched on first + last name, case-insensitively. */
const GUEST_NAMES = [{ firstName: 'Rawa', lastName: 'Afridi' }];

const INQUIRY_EMAILS = [
  'bilidij626@copawoke.com',
  'calit35188@copawoke.com',
  'rewawoy432@primetor.com',
  'rodrigo@villatimtavio.com',
];

const line = (label, n) =>
  console.log(`    ${String(n).padStart(4)}  ${label}`);

async function findGuests() {
  const found = [];
  for (const { firstName, lastName } of GUEST_NAMES) {
    const matches = await prisma.guest.findMany({
      where: {
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
      include: {
        primaryBookings: {
          select: { id: true, checkIn: true, checkOut: true, status: true },
        },
      },
    });

    if (matches.length === 0) {
      console.log(`  ! No guest named ${firstName} ${lastName}`);
      continue;
    }
    // Never assume one. Two guests can share a name, and deleting the wrong
    // Afridi is exactly the mistake this script exists to avoid.
    if (matches.length > 1) {
      console.log(
        `  ! ${matches.length} guests named ${firstName} ${lastName} — refusing to guess:`,
      );
      matches.forEach((g) => console.log(`      ${g.id}  ${g.email}`));
      continue;
    }
    found.push(matches[0]);
  }
  return found;
}

async function purgeGuest(guest) {
  const bookingIds = guest.primaryBookings.map((b) => b.id);

  console.log(`\n  ${guest.firstName} ${guest.lastName} <${guest.email}>`);
  console.log(`  guest id ${guest.id}`);
  guest.primaryBookings.forEach((b) =>
    console.log(
      `    stay ${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut
        .toISOString()
        .slice(0, 10)}  ${b.status}`,
    ),
  );

  const byBooking = { bookingId: { in: bookingIds } };
  const experienceIds = bookingIds.length
    ? (
        await prisma.experienceRequest.findMany({
          where: byBooking,
          select: { id: true },
        })
      ).map((e) => e.id)
    : [];

  // Counted before anything is removed so the dry run and the real run print
  // the same numbers.
  const counts = {
    vendorRatings: experienceIds.length
      ? await prisma.vendorRating.count({
          where: { experienceRequestId: { in: experienceIds } },
        })
      : 0,
    experienceRequests: experienceIds.length,
    diningRequests: await prisma.diningRequest.count({ where: byBooking }),
    folioItems: await prisma.folioItem.count({ where: byBooking }),
    notifications: await prisma.notification.count({ where: byBooking }),
    pushSubscriptions: await prisma.pushSubscription.count({
      where: byBooking,
    }),
    magicTokens: await prisma.magicToken.count({ where: byBooking }),
    manifestGuests: await prisma.manifestGuest.count({ where: byBooking }),
    menuSelections: await prisma.menuSelection.count({ where: byBooking }),
    crmNotes: await prisma.crmNote.count({ where: { guestId: guest.id } }),
    bookings: bookingIds.length,
  };

  const nulled = {
    auditLogs: await prisma.auditLog.count({ where: byBooking }),
    scheduleItems: await prisma.scheduleItem.count({ where: byBooking }),
    stockMovements: await prisma.stockMovement.count({ where: byBooking }),
    satisfactionReviews: await prisma.satisfactionReview.count({
      where: byBooking,
    }),
  };

  console.log('    — deleted —');
  Object.entries(counts).forEach(([k, v]) => line(k, v));
  console.log('    — kept, booking reference cleared —');
  Object.entries(nulled).forEach(([k, v]) => line(k, v));

  if (!APPLY) return;

  await prisma.$transaction(async (tx) => {
    if (bookingIds.length) {
      // Optional references first: nulling cannot fail, and doing it up front
      // means a later error leaves nothing half-deleted behind a live FK.
      await tx.auditLog.updateMany({
        where: byBooking,
        data: { bookingId: null },
      });
      await tx.scheduleItem.updateMany({
        where: byBooking,
        data: { bookingId: null },
      });
      await tx.stockMovement.updateMany({
        where: byBooking,
        data: { bookingId: null },
      });
      await tx.satisfactionReview.updateMany({
        where: byBooking,
        data: { bookingId: null },
      });

      if (experienceIds.length) {
        await tx.vendorRating.deleteMany({
          where: { experienceRequestId: { in: experienceIds } },
        });
      }
      await tx.experienceRequest.deleteMany({ where: byBooking });
      await tx.diningRequest.deleteMany({ where: byBooking });
      await tx.folioItem.deleteMany({ where: byBooking });
      await tx.notification.deleteMany({ where: byBooking });
      await tx.pushSubscription.deleteMany({ where: byBooking });
      await tx.magicToken.deleteMany({ where: byBooking });

      // ManifestGuest, MenuSelection (+ items) and ManifestDraft go with the
      // booking on their own — they declare onDelete: Cascade.
      await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }

    await tx.crmNote.deleteMany({ where: { guestId: guest.id } });
    await tx.guest.delete({ where: { id: guest.id } });
  });

  console.log('    ✓ deleted');
}

async function purgeInquiries() {
  const matches = await prisma.inquiry.findMany({
    where: { email: { in: INQUIRY_EMAILS } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (matches.length === 0) {
    console.log('  Nothing matched those addresses.');
    return;
  }

  matches.forEach((i) =>
    console.log(
      `    ${i.createdAt.toISOString().slice(0, 10)}  ${i.status.padEnd(9)}  ${
        i.firstName
      } ${i.lastName} <${i.email}>`,
    ),
  );

  const unmatched = INQUIRY_EMAILS.filter(
    (e) => !matches.some((m) => m.email.toLowerCase() === e.toLowerCase()),
  );
  unmatched.forEach((e) => console.log(`    (no inquiry for ${e})`));

  if (!APPLY) return;

  // Nothing references Inquiry, so this needs no ordering.
  const { count } = await prisma.inquiry.deleteMany({
    where: { id: { in: matches.map((i) => i.id) } },
  });
  console.log(`    ✓ deleted ${count}`);
}

(async () => {
  console.log(
    APPLY
      ? '\nAPPLYING — this deletes permanently.\n'
      : '\nDRY RUN — nothing will be changed. Re-run with --apply.\n',
  );

  if (!INQUIRIES_ONLY) {
    console.log('Guests');
    const guests = await findGuests();
    for (const guest of guests) await purgeGuest(guest);
    if (guests.length === 0) console.log('  Nothing to do.');
  }

  if (!GUESTS_ONLY) {
    console.log('\nInquiries');
    await purgeInquiries();
  }

  console.log('');
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
