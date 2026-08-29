#!/usr/bin/env node
/**
 * Manifest rows that look like the primary member themselves.
 *
 *   node /app/apps/api/scripts/find-duplicate-primaries.js
 *   node /app/apps/api/scripts/find-duplicate-primaries.js --all
 *   node /app/apps/api/scripts/find-duplicate-primaries.js --json
 *
 * Reads. Never writes. There is no --apply, deliberately.
 *
 * addManifestGuest rejects a guest whose email matches the primary's, and
 * nothing else. A primary who typed their own name against any other address
 * — a work account, a partner's, a typo — got a row. That row emails a
 * secondary access link to whatever was typed, counts toward addedGuests
 * (so a six-person party reads as full with five real guests), and takes a
 * bed off validateRoomCapacity.
 *
 * A name match is evidence, not proof: a father and son share a name, and so
 * do a good many cousins. Deleting on that basis would destroy a real guest,
 * a live magic-link grant and a room assignment. So this prints a list for
 * the estate to read, with the things that decide what to do about each one.
 *
 * Past stays are excluded by default — nothing can be done about a manifest
 * the party has already lived through. --all includes them for counting.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ALL = process.argv.includes('--all');
const JSON_OUT = process.argv.includes('--json');

const day = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Deliberately generous. This is a shortlist a person reads, not a gate — a
 * near-miss costs a glance, a miss costs a phantom nobody looks for.
 */
const normalise = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // An apostrophe elides — O'Brien and OBrien are one name. A hyphen
    // separates — Jean-Luc and Jean Luc are too. Treating both the same way
    // misses one or the other.
    .replace(/['’]/g, '')
    .replace(/[^a-z]+/g, ' ')
    .trim();

const fullName = (first, last) => normalise(`${first ?? ''} ${last ?? ''}`);

(async () => {
  const bookings = await prisma.booking.findMany({
    where: ALL ? {} : { checkOut: { gte: new Date() } },
    select: {
      id: true,
      lodgifyId: true,
      checkIn: true,
      checkOut: true,
      status: true,
      manifestStatus: true,
      totalGuests: true,
      primaryRoomNumber: true,
      primaryGuest: {
        select: { firstName: true, lastName: true, email: true },
      },
      manifestGuests: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roomNumber: true,
          pwaLinkSent: true,
          pwaLinkOpened: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { checkIn: 'asc' },
  });

  const hits = [];

  for (const b of bookings) {
    const primary = fullName(b.primaryGuest.firstName, b.primaryGuest.lastName);
    if (!primary) continue;

    for (const g of b.manifestGuests) {
      if (fullName(g.firstName, g.lastName) !== primary) continue;

      // An exact email match can't be here — the API already refuses it — so
      // every hit is by definition under a different address.
      hits.push({
        bookingId: b.id,
        lodgifyId: b.lodgifyId,
        checkIn: day(b.checkIn),
        checkOut: day(b.checkOut),
        status: b.status,
        manifestStatus: b.manifestStatus,
        totalGuests: b.totalGuests,
        primaryName: `${b.primaryGuest.firstName} ${b.primaryGuest.lastName}`,
        primaryEmail: b.primaryGuest.email,
        primaryRoomNumber: b.primaryRoomNumber,
        rowId: g.id,
        rowName: `${g.firstName} ${g.lastName}`,
        rowEmail: g.email,
        rowRoomNumber: g.roomNumber,
        linkSent: g.pwaLinkSent,
        linkOpened: g.pwaLinkOpened,
        addedAt: day(g.createdAt),
        // The three things that decide what to do about it.
        holdsARoom: g.roomNumber != null,
        sameRoomAsPrimary:
          g.roomNumber != null && g.roomNumber === b.primaryRoomNumber,
        countsTowardFull:
          b.totalGuests > 0 &&
          b.manifestGuests.length + (b.primaryRoomNumber != null ? 1 : 0) >=
            b.totalGuests,
      });
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(hits, null, 2));
    return;
  }

  console.log(
    `\n  ${bookings.length} booking(s) examined` +
      (ALL ? ' (including past stays).' : ' with a checkout today or later.'),
  );

  if (hits.length === 0) {
    console.log('\n  No manifest row matches its own primary member.\n');
    return;
  }

  console.log(
    `  ${hits.length} manifest row(s) carry their booking's primary name.\n`,
  );

  for (const h of hits) {
    console.log(`  ─────────────────────────────────────────────────────────`);
    console.log(`  ${h.primaryName}   ${h.checkIn} → ${h.checkOut}`);
    console.log(
      `  Booking ${h.bookingId}   Lodgify ${h.lodgifyId ?? '—'}   ${h.status} / ${h.manifestStatus}`,
    );
    console.log('');
    console.log(`    primary   ${h.primaryEmail}`);
    console.log(
      `              room ${h.primaryRoomNumber ?? 'none chosen'}`,
    );
    console.log(`    the row   ${h.rowEmail}      added ${h.addedAt}`);
    console.log(
      `              room ${h.rowRoomNumber ?? 'none'}` +
        (h.sameRoomAsPrimary ? '   ← the primary\'s own room' : ''),
    );
    console.log(
      `              access link ${h.linkSent ? 'SENT' : 'not sent'}` +
        (h.linkOpened ? ' and OPENED' : ''),
    );
    console.log('');
    const flags = [];
    if (h.linkSent && h.linkOpened)
      flags.push('someone signed in with this link — find out who before removing it');
    else if (h.linkSent)
      flags.push('a link reached that address');
    if (h.holdsARoom) flags.push('holds a bed against room capacity');
    if (h.countsTowardFull)
      flags.push(`party reads as full at ${h.totalGuests} — "Add guest" is hidden`);
    if (h.manifestStatus === 'SUBMITTED' || h.manifestStatus === 'APPROVED')
      flags.push('already sent to the estate — they may be catering for it');
    flags.forEach((f) => console.log(`    ·  ${f}`));
    console.log('');
  }

  console.log(`  ─────────────────────────────────────────────────────────`);
  console.log(
    '\n  A shared name is not proof. Check each against the reservation\n' +
      '  before anything is removed — and remember a sent link is an access\n' +
      "  grant, so revoking it is part of the job, not a side effect.\n",
  );
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
