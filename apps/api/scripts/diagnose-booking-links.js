#!/usr/bin/env node
/**
 * Read-only. Answers "why is this reservation not showing as a guest?"
 *
 *   node /app/apps/api/scripts/diagnose-booking-links.js
 *
 * Changes nothing. Three questions, in order of how often they turn out to be
 * the answer:
 *
 *   1. Which Booked reservations in Lodgify have no booking here at all.
 *   2. Which bookings are filed under a guest whose email is not the one
 *      Lodgify sent. A booking attaches to a Guest by email, so a reservation
 *      carrying somebody else's address lands on their record — the guest it
 *      belongs to never appears, and the guest it landed on grows a stay that
 *      is not theirs.
 *   3. Which guests hold more than one live booking, since that is what makes
 *      a stay history read longer than it should.
 *
 * lodgifyRawData is the payload as it arrived, so question 2 is answerable
 * without asking Lodgify again.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const KEY = process.env.LODGIFY_API_KEY;
const PROPERTY = process.env.LODGIFY_PROPERTY_ID;

const NOT_A_STAY = ['deleted', 'declined', 'cancelled', 'canceled', 'open'];
const isStay = (r) =>
  r.is_deleted !== true &&
  r.canceled_at == null &&
  !NOT_A_STAY.includes(String(r.status ?? '').toLowerCase());

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');
const rawEmail = (raw) =>
  (raw && typeof raw === 'object' && raw.guest && raw.guest.email) || null;
const rawName = (raw) => {
  const g = raw && typeof raw === 'object' ? raw.guest : null;
  if (!g) return null;
  return (
    g.name ||
    [g.first_name, g.last_name].filter(Boolean).join(' ') ||
    null
  );
};

(async () => {
  const bookings = await prisma.booking.findMany({
    orderBy: { checkIn: 'asc' },
    select: {
      id: true,
      lodgifyId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      status: true,
      totalGuests: true,
      lodgifyRawData: true,
      primaryGuest: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  console.log(`\n${bookings.length} booking(s) in the database.\n`);

  // ── 1. In Lodgify, absent here ───────────────────────────────────────────
  if (KEY && PROPERTY) {
    const res = await fetch(
      `https://api.lodgify.com/v2/reservations/bookings?propertyId=${PROPERTY}&size=100`,
      { headers: { 'X-ApiKey': KEY } },
    );
    if (!res.ok) {
      console.log(`  ! Lodgify said ${res.status} — skipping the comparison\n`);
    } else {
      const items = (await res.json()).items ?? [];
      const stays = items.filter(isStay);
      const known = new Set(bookings.map((b) => b.lodgifyId));
      const missing = stays.filter((r) => !known.has(String(r.id)));

      console.log(`── In Lodgify as a stay, absent here: ${missing.length}`);
      for (const r of missing) {
        console.log(
          `   ${String(r.id).padEnd(10)} ${day(r.arrival)} → ${day(r.departure)}  ` +
            `${rawName(r) ?? '(no name)'} <${rawEmail(r) ?? 'no email'}>`,
        );
      }
      console.log('');
    }
  } else {
    console.log('── Lodgify comparison skipped (no API key in this shell)\n');
  }

  // ── 2. Filed under the wrong guest ───────────────────────────────────────
  const mismatched = bookings.filter((b) => {
    const sent = rawEmail(b.lodgifyRawData);
    return (
      sent &&
      sent.trim().toLowerCase() !== b.primaryGuest.email.trim().toLowerCase()
    );
  });

  console.log(`── Filed under a guest Lodgify did not name: ${mismatched.length}`);
  for (const b of mismatched) {
    console.log(
      `   ${b.lodgifyId.padEnd(10)} ${day(b.checkIn)} → ${day(b.checkOut)}  ${b.nights}n  ${b.status}`,
    );
    console.log(
      `      Lodgify sent : ${rawName(b.lodgifyRawData) ?? '(no name)'} <${rawEmail(b.lodgifyRawData)}>`,
    );
    console.log(
      `      filed under  : ${b.primaryGuest.firstName} ${b.primaryGuest.lastName} <${b.primaryGuest.email}>`,
    );
  }
  console.log('');

  // ── 3. Guests holding several live bookings ──────────────────────────────
  const live = bookings.filter(
    (b) => b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT',
  );
  const byGuest = new Map();
  for (const b of live) {
    const k = b.primaryGuest.email;
    byGuest.set(k, [...(byGuest.get(k) ?? []), b]);
  }
  const several = [...byGuest.entries()].filter(([, list]) => list.length > 1);

  console.log(`── Guests holding more than one live booking: ${several.length}`);
  for (const [email, list] of several) {
    const g = list[0].primaryGuest;
    console.log(`   ${g.firstName} ${g.lastName} <${email}> — ${list.length} stays`);
    for (const b of list) {
      const sent = rawEmail(b.lodgifyRawData);
      const flag = sent && sent.toLowerCase() !== email.toLowerCase() ? '  ← not theirs' : '';
      console.log(
        `      ${day(b.checkIn)} → ${day(b.checkOut)}  ${b.nights}n  ${b.status}${flag}`,
      );
    }
  }
  console.log('');
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
