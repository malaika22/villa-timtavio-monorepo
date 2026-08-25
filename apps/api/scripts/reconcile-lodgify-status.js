#!/usr/bin/env node
/**
 * Cancels bookings Lodgify no longer counts as a stay.
 *
 * The sync used to accept any reservation Lodgify returned that wasn't
 * explicitly deleted, so a *declined* one was synced as CONFIRMED every five
 * minutes and sat in Guests as an arriving party — while the broker calendar,
 * which reads Lodgify's availability rather than its reservation list, showed
 * the same nights for sale. The calendar was right.
 *
 * The sync now refuses those on the way in and cancels any it has already
 * created, so this is only needed once: to clear the ones synced before the
 * fix, without waiting for a poll to happen upon each of them.
 *
 *   node /app/apps/api/scripts/reconcile-lodgify-status.js          # dry run
 *   node /app/apps/api/scripts/reconcile-lodgify-status.js --apply
 *
 * Dry by default. This cancels stays, and a list you can read beats a summary
 * you have to trust.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const KEY = process.env.LODGIFY_API_KEY;
const PROPERTY = process.env.LODGIFY_PROPERTY_ID;
const APPLY = process.argv.includes('--apply');

// Mirrors normalizeLodgifyBooking. Kept in step by hand: the API can't be
// imported here, since this runs as plain Node against the compiled image.
const NOT_A_STAY = ['deleted', 'declined', 'cancelled', 'canceled', 'open'];

const isStay = (r) =>
  r.is_deleted !== true &&
  r.canceled_at == null &&
  !NOT_A_STAY.includes(String(r.status ?? '').toLowerCase());

(async () => {
  if (!KEY || !PROPERTY) {
    console.error('LODGIFY_API_KEY and LODGIFY_PROPERTY_ID must be set.');
    process.exit(1);
  }

  const res = await fetch(
    `https://api.lodgify.com/v2/reservations/bookings?propertyId=${PROPERTY}&size=100`,
    { headers: { 'X-ApiKey': KEY, 'Content-Type': 'application/json' } },
  );
  if (!res.ok) {
    console.error(`Lodgify returned HTTP ${res.status}`);
    process.exit(1);
  }

  const items = (await res.json())?.items ?? [];

  // An empty list looks identical to "every reservation was declined". Never
  // act on it — the same reasoning that guards the deletion reconciler.
  if (items.length === 0) {
    console.error('Lodgify returned no reservations — refusing to act.');
    process.exit(1);
  }

  const notStays = new Map();
  for (const r of items) {
    if (!isStay(r)) notStays.set(String(r.id), String(r.status ?? 'not a stay'));
  }

  console.log(`Lodgify returned ${items.length} reservations.`);
  console.log(`${notStays.size} are not stays:\n`);
  for (const [id, status] of notStays) console.log(`  ${id}  ${status}`);

  if (notStays.size === 0) {
    console.log('\nNothing to reconcile.');
    return;
  }

  const affected = await prisma.booking.findMany({
    where: {
      lodgifyId: { in: [...notStays.keys()] },
      status: { notIn: ['CANCELLED', 'CHECKED_OUT'] },
    },
    include: { primaryGuest: { select: { firstName: true, lastName: true } } },
  });

  console.log(`\n${affected.length} of those are active in the estate's records:\n`);
  for (const b of affected) {
    const g = b.primaryGuest;
    console.log(
      `  ${b.lodgifyId}  ${g.firstName} ${g.lastName}  ` +
        `${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut.toISOString().slice(0, 10)}  ` +
        `[${b.status}] Lodgify says "${notStays.get(b.lodgifyId)}"`,
    );
  }

  if (affected.length === 0) {
    console.log('\nNothing to change.');
    return;
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to cancel these.');
    return;
  }

  for (const b of affected) {
    await prisma.booking.update({
      where: { id: b.id },
      data: { status: 'CANCELLED' },
    });
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_STATUS_CHANGED',
        entityType: 'Booking',
        entityId: b.id,
        performedBy: 'reconcile-lodgify-status',
        performedByRole: 'system',
        bookingId: b.id,
        afterState: {
          status: 'CANCELLED',
          reason: `Lodgify reports this reservation as "${notStays.get(b.lodgifyId)}"`,
          lodgifyId: b.lodgifyId,
        },
      },
    });
  }

  console.log(`\nCancelled ${affected.length} booking(s).`);
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
