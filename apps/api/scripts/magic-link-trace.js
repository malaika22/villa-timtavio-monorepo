#!/usr/bin/env node
/**
 * Where each guest's access link actually got to.
 *
 *   node /app/apps/api/scripts/magic-link-trace.js
 *   node /app/apps/api/scripts/magic-link-trace.js --email=someone@example.com
 *   node /app/apps/api/scripts/magic-link-trace.js --booking=<bookingId>
 *
 * Reads. Never writes.
 *
 * Sending is a queued job, and the job leaves three marks in order:
 *
 *   1. MagicToken row      — written after Auth0, before the email
 *   2. Resend accepts it   — no direct mark; step 3 only happens if it did
 *   3. MAGIC_LINK_SENT     — audit row, written last
 *
 * So the gap between them says where it stopped. No token means it never got
 * past Auth0. A token with no audit row means Resend threw. Both present means
 * the email left the building and the question is delivery — which is the
 * Resend dashboard's to answer, not ours.
 *
 * pwaLinkSent is not evidence on its own: it is written in the same step as
 * the audit row, but the manifest also used to set it optimistically when the
 * job was merely queued, so rows created before that was fixed may claim a
 * link that never went.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const arg = (n) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : null;
};

const day = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : null);
const LIVE = ['CONFIRMED', 'CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'];

(async () => {
  const email = arg('email')?.trim().toLowerCase();
  const bookingId = arg('booking');

  const bookings = await prisma.booking.findMany({
    where: bookingId
      ? { id: bookingId }
      : { status: { in: LIVE }, checkOut: { gte: new Date() } },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      manifestStatus: true,
      primaryGuest: { select: { firstName: true, lastName: true, email: true } },
      manifestGuests: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          pwaLinkSent: true,
          pwaLinkSentAt: true,
          pwaLinkOpened: true,
          auth0UserId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { checkIn: 'asc' },
  });

  if (bookings.length === 0) {
    console.log('\n  No matching booking.\n');
    return;
  }

  for (const b of bookings) {
    const people = [
      {
        ...b.primaryGuest,
        tier: 'primary',
        pwaLinkSent: null,
        pwaLinkSentAt: null,
        pwaLinkOpened: null,
        auth0UserId: null,
      },
      ...b.manifestGuests.map((g) => ({ ...g, tier: 'secondary' })),
    ].filter((p) => !email || p.email?.toLowerCase() === email);

    if (people.length === 0) continue;

    console.log(`\n  ═══ ${b.primaryGuest.firstName} ${b.primaryGuest.lastName} · ` +
      `${day(b.checkIn)?.slice(0, 10)} → ${day(b.checkOut)?.slice(0, 10)} · ${b.manifestStatus}`);
    console.log(`      booking ${b.id}\n`);

    for (const p of people) {
      const addr = p.email?.trim();
      if (!addr) {
        console.log(`  ·  ${p.firstName} ${p.lastName} — no email on file, nothing was ever sent.\n`);
        continue;
      }

      const [tokens, audits] = await Promise.all([
        prisma.magicToken.findMany({
          where: { email: addr, bookingId: b.id },
          select: { createdAt: true, expiresAt: true, used: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        prisma.auditLog.findMany({
          where: {
            bookingId: b.id,
            action: { in: ['MAGIC_LINK_SENT', 'MAGIC_LINK_RESENT'] },
          },
          select: { action: true, createdAt: true, metadata: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const mine = audits.filter(
        (a) =>
          String(a.metadata?.email ?? '').toLowerCase() === addr.toLowerCase() ||
          a.action === 'MAGIC_LINK_RESENT',
      );

      // A token that ran out before anybody used it is its own answer, and
      // the common one: links minted before 2026-08-26 lived thirty minutes
      // rather than the length of the stay, so every one of them is dead now
      // and no amount of staring at Resend will explain it.
      const latest = tokens[0];
      const diedUnused =
        latest && !latest.used && new Date(latest.expiresAt) <= new Date();
      const lifeMins = latest
        ? Math.round(
            (new Date(latest.expiresAt).getTime() -
              new Date(latest.createdAt).getTime()) /
              60000,
          )
        : 0;

      let verdict;
      if (diedUnused && lifeMins < 120)
        verdict =
          `the mail was fine — this token EXPIRED UNUSED after ${lifeMins}min ` +
          '(minted before the stay-long expiry shipped). Send a new link.';
      else if (diedUnused)
        verdict =
          'delivered, but the token EXPIRED before it was opened. Send a new link.';
      else if (mine.length > 0)
        verdict = 'Resend ACCEPTED it — check the Resend dashboard for delivery/bounce/spam';
      else if (tokens.length > 0)
        verdict = 'token written but no audit row → the EMAIL SEND THREW (Resend)';
      else
        verdict = 'no token at all → it never got past Auth0, or the job never ran';

      console.log(`  ·  ${p.firstName} ${p.lastName}  <${addr}>  [${p.tier}]`);
      if (p.tier === 'secondary') {
        console.log(
          `       pwaLinkSent ${p.pwaLinkSent ? 'true' : 'false'}` +
            (p.pwaLinkSentAt ? ` at ${day(p.pwaLinkSentAt)}` : '') +
            `   opened ${p.pwaLinkOpened ? 'YES' : 'no'}` +
            `   auth0 ${p.auth0UserId ? 'yes' : 'none'}`,
        );
      }
      console.log(`       magic tokens: ${tokens.length}` +
        (tokens[0] ? `  latest ${day(tokens[0].createdAt)}, expires ${day(tokens[0].expiresAt)}` +
          (tokens[0].used ? ', USED' : ', never used') : ''));
      console.log(`       audit rows:   ${mine.length}` +
        (mine[0] ? `  latest ${mine[0].action} ${day(mine[0].createdAt)}` : ''));
      console.log(`       →  ${verdict}\n`);
    }
  }

  console.log(
    '  A link that Resend accepted, has NOT expired, and the guest never opened\n' +
      '  is almost always spam filtering — check the Resend dashboard for that\n' +
      '  address before resending, because a second copy lands in the same\n' +
      '  folder. An expired one just needs a new link.\n',
  );
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
