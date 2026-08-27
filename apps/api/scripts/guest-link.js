#!/usr/bin/env node
/**
 * A sign-in link for an existing guest, printed rather than emailed.
 *
 *   node /app/apps/api/scripts/guest-link.js --email=someone@example.com
 *   node /app/apps/api/scripts/guest-link.js --email=... --booking=2
 *   node /app/apps/api/scripts/guest-link.js --email=... --ttl-hours=8
 *   node /app/apps/api/scripts/guest-link.js --email=... --revoke
 *
 * For looking at what a guest sees when something is wrong with their stay.
 * It mints the same MagicToken the ordinary flow does and stops there: no
 * mail is sent, no Auth0 account is touched, and the queue is not involved.
 * verifyOtpAndIssueToken needs only the row.
 *
 * Two hours by default, not the length of the stay.
 *
 * A guest's own code lives until 24 hours after checkout, because it travels
 * through an inbox and has to still work next Tuesday. This one is printed to
 * the terminal of whoever asked for it, so the same reasoning points the other
 * way — and it opens somebody else's manifest, folio and allergies. `--revoke`
 * clears every token for that address when you are finished.
 *
 * Works for a primary member or anyone on a manifest; the tier is worked out
 * rather than assumed, since the two see different apps.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const REVOKE = process.argv.includes('--revoke');
const TTL_HOURS = Number(arg('ttl-hours')) || 2;

const day = (d) => new Date(d).toISOString().slice(0, 10);
const LIVE = ['CONFIRMED', 'CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'];

(async () => {
  const email = (arg('email') ?? '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: guest-link.js --email=someone@example.com');
    process.exit(1);
  }

  if (REVOKE) {
    const { count } = await prisma.magicToken.deleteMany({ where: { email } });
    console.log(`\n  Revoked ${count} token(s) for ${email}.\n`);
    return;
  }

  // Primary first. A primary member's bookings hang off their Guest row; a
  // secondary's come from the manifest they were added to, and the two land in
  // different halves of the app.
  const guest = await prisma.guest.findUnique({
    where: { email },
    select: {
      firstName: true,
      lastName: true,
      primaryBookings: {
        where: { status: { in: LIVE } },
        orderBy: { checkIn: 'asc' },
        select: { id: true, checkIn: true, checkOut: true, nights: true, status: true },
      },
    },
  });

  let tier = 'primary';
  let who = guest ? `${guest.firstName} ${guest.lastName}` : null;
  let bookings = guest?.primaryBookings ?? [];

  if (bookings.length === 0) {
    const onManifest = await prisma.manifestGuest.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        firstName: true,
        lastName: true,
        booking: {
          select: { id: true, checkIn: true, checkOut: true, nights: true, status: true },
        },
      },
    });
    const live = onManifest.filter((m) => LIVE.includes(m.booking.status));
    if (live.length > 0) {
      tier = 'secondary';
      who = `${live[0].firstName} ${live[0].lastName}`;
      bookings = live
        .map((m) => m.booking)
        .sort((a, b) => +a.checkIn - +b.checkIn);
    }
  }

  if (bookings.length === 0) {
    console.log(
      `\n  No live booking for ${email}.` +
        (guest ? ' They exist as a guest but have no current stay.' : '') +
        '\n',
    );
    return;
  }

  // More than one is worth stopping for rather than guessing — the whole
  // reason for looking is usually that the wrong stay is on screen.
  const pick = Number(arg('booking'));
  if (bookings.length > 1 && !pick) {
    console.log(`\n  ${who} <${email}> has ${bookings.length} live stays:\n`);
    bookings.forEach((b, i) => {
      console.log(
        `    ${i + 1}.  ${day(b.checkIn)} → ${day(b.checkOut)}  ${b.nights}n  ${b.status}`,
      );
    });
    console.log('\n  Re-run with --booking=1 (or 2, …) to choose.\n');
    return;
  }

  const booking = bookings[pick ? pick - 1 : 0];
  if (!booking) {
    console.error(`  No booking ${pick}. There are ${bookings.length}.`);
    process.exit(1);
  }

  const pwa = process.env.PWA_URL;
  if (!pwa) {
    console.error('  PWA_URL is not set — cannot build a link.');
    process.exit(1);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  await prisma.magicToken.create({
    data: {
      email,
      otp,
      bookingId: booking.id,
      guestTier: tier,
      expiresAt: new Date(Date.now() + TTL_HOURS * 3_600_000),
    },
  });

  console.log(
    [
      '',
      `  ${who} <${email}> — ${tier}`,
      `  ${day(booking.checkIn)} → ${day(booking.checkOut)}  ${booking.nights} nights  ${booking.status}`,
      '',
      `  ${pwa}/auth/callback?otp=${otp}&email=${encodeURIComponent(email)}`,
      '',
      `  Code: ${otp}    Valid ${TTL_HOURS}h`,
      `  When you are done:  node scripts/guest-link.js --email=${email} --revoke`,
      '',
    ].join('\n'),
  );
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
