#!/usr/bin/env node
/**
 * Creates one complete fictional stay, so every screen has something to show
 * without a real guest's name on it.
 *
 * Screenshots of the live estate would publish guests' names, emails, phone
 * numbers and — on the run sheet and the brief — their allergies. Blurring that
 * out looks apologetic and is easy to do incompletely. A whole invented party
 * is cleaner: every screen renders finished, and nothing on it belongs to a
 * real person.
 *
 *   node scripts/demo-stay.js create
 *   node scripts/demo-stay.js create --email=you@example.com
 *   node scripts/demo-stay.js link   --email=you@example.com
 *   node scripts/demo-stay.js remove
 *
 * Pass `--email` and the stay is put in that address's name and a sign-in link
 * is printed for it — a working PWA session (menus, experiences, the lot)
 * without a Lodgify reservation or an inquiry behind it. `link` mints a fresh
 * one against the stay that already exists.
 *
 * The link is minted here rather than mailed: verifyOtpAndIssueToken needs
 * only a MagicToken row matching the address, and treats the Auth0 user as
 * optional. So no mail is sent, no Auth0 account is made, and the queue is not
 * involved. It is the ordinary sign-in path with the delivery step skipped.
 *
 * Everything it writes hangs off one Booking, and `remove` deletes that
 * booking — the schema cascades manifest guests, menu selections and requests
 * with it. Run `remove` as soon as the screenshots are taken; this is staging
 * dressed as data, and it should not be sitting in the estate's numbers when
 * the owner next opens Reports.
 *
 * Safe to re-run: `create` removes any previous demo stay first.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

/**
 * Long by default, unlike the 30 minutes a guest gets.
 *
 * That window exists because a real link travels through an inbox. This one is
 * printed to the terminal of the person who asked for it, and having it lapse
 * while they are halfway through testing the menu helps nobody.
 */
const TTL_HOURS = Number(arg('ttl-hours')) || 24 * 7;

// A recognisable marker so `remove` can find everything without guessing, and
// so anyone browsing the database can tell at a glance this isn't a real stay.
const DEMO_LODGIFY_ID = 'DEMO-PORTFOLIO-0001';
const DEMO_DOMAIN = 'example.com';

const PARTY = [
  {
    firstName: 'Alejandro',
    lastName: 'Ruiz',
    relationship: 'Friend',
    allergies: 'Severe shellfish allergy',
    dietaryRestrictions: ['no_shellfish'],
    specialNotes: 'Early riser — coffee from 7',
  },
  {
    firstName: 'Sofía',
    lastName: 'Herrera',
    relationship: 'Partner',
    allergies: null,
    dietaryRestrictions: ['vegetarian'],
    specialNotes: 'Birthday on the second night',
  },
  {
    firstName: 'Marco',
    lastName: 'Delgado',
    relationship: 'Friend',
    allergies: null,
    dietaryRestrictions: [],
    specialNotes: null,
  },
  {
    firstName: 'Camila',
    lastName: 'Ortega',
    relationship: 'Friend',
    allergies: 'Mild lactose intolerance',
    dietaryRestrictions: ['no_dairy'],
    specialNotes: null,
  },
  {
    firstName: 'Diego',
    lastName: 'Navarro',
    relationship: 'Friend',
    allergies: null,
    dietaryRestrictions: ['gluten_free'],
    specialNotes: null,
  },
];

const email = (g) =>
  `${g.firstName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${g.lastName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@${DEMO_DOMAIN}`;

const atMidnight = (d) => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
};

async function remove() {
  const existing = await prisma.booking.findUnique({
    where: { lodgifyId: DEMO_LODGIFY_ID },
    select: { id: true, primaryGuestId: true },
  });

  if (!existing) {
    console.log('No demo stay found.');
    return;
  }

  // Everything that points at the booking with a required foreign key, or
  // Postgres refuses the delete. This used to clear only folio items and
  // experience requests, which was enough while nothing ever signed in: the
  // moment the demo stay is used as a real PWA session it grows magic tokens,
  // and notifications and a push subscription if the guest opens the app.
  const where = { bookingId: existing.id };
  const experienceIds = (
    await prisma.experienceRequest.findMany({ where, select: { id: true } })
  ).map((e) => e.id);

  // Optional references are nulled rather than deleted — an audit entry
  // outlives the booking it describes.
  await prisma.auditLog.updateMany({ where, data: { bookingId: null } });
  await prisma.scheduleItem.updateMany({ where, data: { bookingId: null } });
  await prisma.stockMovement.updateMany({ where, data: { bookingId: null } });
  await prisma.satisfactionReview.updateMany({
    where,
    data: { bookingId: null },
  });

  if (experienceIds.length) {
    await prisma.vendorRating.deleteMany({
      where: { experienceRequestId: { in: experienceIds } },
    });
  }
  await prisma.experienceRequest.deleteMany({ where });
  await prisma.diningRequest.deleteMany({ where });
  await prisma.folioItem.deleteMany({ where });
  await prisma.notification.deleteMany({ where });
  await prisma.pushSubscription.deleteMany({ where });
  await prisma.magicToken.deleteMany({ where });

  // ManifestGuest, MenuSelection (+ items) and ManifestDraft cascade.
  await prisma.booking.delete({ where: { id: existing.id } });
  await prisma.guest
    .delete({ where: { id: existing.primaryGuestId } })
    .catch(() => {
      // The primary may be shared with another booking in odd data; leaving a
      // stray guest is harmless, failing the cleanup is not.
    });

  console.log('Demo stay removed.');
}

/**
 * Mints a sign-in link for a booking and prints it.
 *
 * Deliberately mirrors processMagicLink's second step and skips its first and
 * third. Step one creates an Auth0 user, which verification treats as optional
 * — it falls back to the email for `sub`. Step three sends mail, which is the
 * part we are here to avoid.
 */
async function mintLink(bookingId, guestEmail) {
  const pwa = process.env.PWA_URL;
  if (!pwa) {
    console.error('PWA_URL is not set — cannot build a sign-in link.');
    return null;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3_600_000);

  await prisma.magicToken.create({
    data: {
      email: guestEmail,
      otp,
      bookingId,
      guestTier: 'primary',
      expiresAt,
    },
  });

  const url = `${pwa}/auth/callback?otp=${otp}&email=${encodeURIComponent(guestEmail)}`;
  console.log(
    [
      '',
      '  Sign-in link (valid ' + TTL_HOURS + 'h):',
      '  ' + url,
      '',
      '  Or enter the code by hand: ' + otp,
    ].join('\n'),
  );
  return url;
}

async function link() {
  const wanted = arg('email');
  const booking = await prisma.booking.findUnique({
    where: { lodgifyId: DEMO_LODGIFY_ID },
    include: { primaryGuest: { select: { email: true } } },
  });

  if (!booking) {
    console.log('No demo stay found. Run `create` first.');
    return;
  }

  const target = wanted ?? booking.primaryGuest.email;
  if (wanted && wanted !== booking.primaryGuest.email) {
    // The token is matched on (otp, email), so a link for an address the stay
    // is not in would verify and then show an empty app.
    console.log(
      `  ! The demo stay is in ${booking.primaryGuest.email}'s name.\n` +
        '    Re-run `create --email=...` to put it in another.',
    );
    return;
  }

  await mintLink(booking.id, target);
}

async function create() {
  await remove();

  // Arriving in three days: near enough that the dashboard treats it as the
  // next stay and the run sheet has days to show, far enough that the menu
  // cutoff hasn't closed anything.
  const checkIn = atMidnight(new Date(Date.now() + 3 * 86_400_000));
  const checkOut = atMidnight(new Date(Date.now() + 8 * 86_400_000));
  const nights = 5;

  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
  });
  if (rooms.length === 0) {
    console.error('No rooms configured — seed rooms before the demo stay.');
    process.exit(1);
  }

  // Whose stay this is.
  //
  // Defaults to the invented primary, because the original job here was
  // screenshots and a real address in them defeats the point. Given --email it
  // becomes that person's stay instead, so the sign-in link lands them in a
  // PWA session that is genuinely theirs.
  const wanted = arg('email');
  const primaryEmail = wanted ?? `isabela.marchetti@${DEMO_DOMAIN}`;

  if (wanted) {
    // Refuse to repurpose an address that already has stays. Renaming a real
    // guest to Isabela Marchetti and hanging a fake booking off them is a much
    // worse outcome than an error message.
    const existing = await prisma.guest.findUnique({
      where: { email: wanted },
      include: { _count: { select: { primaryBookings: true } } },
    });
    if (existing && existing._count.primaryBookings > 0) {
      console.error(
        `${wanted} already belongs to a guest with ${existing._count.primaryBookings} booking(s). ` +
          'Use an address that is not in use.',
      );
      process.exit(1);
    }
  }

  const primary = await prisma.guest.upsert({
    where: { email: primaryEmail },
    update: {},
    create: {
      email: primaryEmail,
      firstName: 'Isabela',
      lastName: 'Marchetti',
      phone: '+52 555 000 0000',
      role: 'PRIMARY',
      dietaryRestrictions: [],
      beveragePreferences: 'Mezcal, nothing sweet',
      winePreferences: 'Red, Mexican if you have it',
      specialOccasions: "Sofía's birthday on the second night",
      preferredTimes: 'Dinner late — nine or after',
    },
  });

  const booking = await prisma.booking.create({
    data: {
      lodgifyId: DEMO_LODGIFY_ID,
      checkIn,
      checkOut,
      nights,
      totalGuests: 6,
      primaryGuestId: primary.id,
      primaryRoomNumber: rooms[0].number,
      status: 'CONFIRMED',
      manifestStatus: 'SUBMITTED',
      baseRate: 42_500,
      internalNotes: 'Demo stay for portfolio screenshots — safe to delete.',
    },
  });

  for (const [i, person] of PARTY.entries()) {
    await prisma.manifestGuest.create({
      data: {
        bookingId: booking.id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: email(person),
        phone: '+52 555 000 000' + (i + 1),
        relationship: person.relationship,
        // Spread across whatever rooms exist rather than assuming a layout.
        roomNumber: rooms[Math.min(i + 1, rooms.length - 1)].number,
        dietaryRestrictions: person.dietaryRestrictions,
        allergies: person.allergies,
        specialNotes: person.specialNotes,
        pwaLinkSent: true,
        pwaLinkSentAt: new Date(),
        pwaLinkOpened: i < 3,
      },
    });
  }

  // ── Composed menus, so the run sheet and the guest's dining screen both
  //    have something to render rather than an empty state.
  const dishes = await prisma.menuItem.findMany({
    where: { isActive: true, course: { not: null } },
    orderBy: { name: 'asc' },
  });

  const byCourse = new Map();
  for (const dish of dishes) {
    const list = byCourse.get(dish.course) ?? [];
    list.push(dish);
    byCourse.set(dish.course, list);
  }

  const MEALS = [
    { mealType: 'BREAKFAST', courses: ['BREAKFAST_MAIN', 'BREAKFAST_SUGGESTION'] },
    { mealType: 'LUNCH', courses: ['LUNCH_SELECTION'] },
    {
      mealType: 'DINNER',
      courses: ['DINNER_STARTER', 'DINNER_MAIN', 'DINNER_DESSERT'],
    },
  ];

  let composed = 0;
  for (let day = 0; day < 3; day++) {
    const date = atMidnight(new Date(+checkIn + day * 86_400_000));

    for (const meal of MEALS) {
      const picks = [];
      for (const course of meal.courses) {
        const pool = byCourse.get(course) ?? [];
        // Rotate through the pool so consecutive days don't read identically.
        for (let n = 0; n < Math.min(2, pool.length); n++) {
          const dish = pool[(day * 2 + n) % pool.length];
          if (dish) picks.push({ dish, course });
        }
      }
      if (picks.length === 0) continue;

      const selection = await prisma.menuSelection.create({
        data: {
          bookingId: booking.id,
          date,
          mealType: meal.mealType,
          chosenByEmail: primary.email,
          note:
            day === 1 && meal.mealType === 'LUNCH'
              ? "We're out on the boat until one — keep it light."
              : null,
        },
      });

      await prisma.menuSelectionItem.createMany({
        data: picks.map((p, order) => ({
          selectionId: selection.id,
          menuItemId: p.dish.id,
          course: p.course,
          sortOrder: order,
        })),
      });
      composed++;
    }
  }

  // ── A couple of experiences and some folio lines, so Approvals and Folio
  //    aren't empty either.
  const catalog = await prisma.catalogItem.findMany({
    where: { isActive: true },
    take: 2,
    orderBy: { name: 'asc' },
  });

  for (const [i, item] of catalog.entries()) {
    await prisma.experienceRequest.create({
      data: {
        bookingId: booking.id,
        catalogItemId: item.id,
        requestedByEmail: i === 0 ? primary.email : email(PARTY[0]),
        requestedByName:
          i === 0
            ? `${primary.firstName} ${primary.lastName}`
            : `${PARTY[0].firstName} ${PARTY[0].lastName}`,
        guestCount: i === 0 ? 6 : 2,
        preferredDate: new Date(+checkIn + (i + 1) * 86_400_000),
        preferredTime: i === 0 ? '17:00' : '10:00',
        status: i === 0 ? 'PENDING' : 'CONFIRMED',
        ...(i === 1
          ? {
              confirmedDate: new Date(+checkIn + 2 * 86_400_000),
              confirmedTime: '10:00',
            }
          : {}),
      },
    });
  }

  const editableUntil = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.folioItem.createMany({
    data: [
      {
        bookingId: booking.id,
        type: 'ESTATE_BASE_RATE',
        description: `Villa TimTavio Estate — ${nights} nights`,
        amount: 42_500,
        quantity: 1,
        loggedBy: 'system',
        editableUntil,
      },
      {
        bookingId: booking.id,
        type: 'DINING',
        description: 'Reserve list — Casa Dragones Joven',
        amount: 2_400,
        quantity: 1,
        attributedToEmail: primary.email,
        attributedToName: `${primary.firstName} ${primary.lastName}`,
        loggedBy: 'estate_manager',
        editableUntil,
      },
      {
        bookingId: booking.id,
        type: 'INCIDENTAL',
        description: 'Airport transfer — arrival',
        amount: 180,
        quantity: 1,
        loggedBy: 'estate_manager',
        editableUntil,
      },
    ],
  });

  console.log(
    [
      'Demo stay created.',
      `  Booking      ${booking.id}`,
      `  Primary      ${primary.firstName} ${primary.lastName} <${primary.email}>`,
      `  Party        ${PARTY.length + 1} guests`,
      `  Dates        ${checkIn.toDateString()} → ${checkOut.toDateString()}`,
      `  Meals        ${composed} composed across 3 days`,
      `  Experiences  ${catalog.length}`,
      '',
      'When you are done: node scripts/demo-stay.js remove',
    ].join('\n'),
  );

  // Only when asked for. Without --email the stay is in a fictional guest's
  // name for screenshots, and a sign-in link for nobody is just noise.
  if (arg('email')) await mintLink(booking.id, primary.email);
}

const command = process.argv[2];

(async () => {
  if (command === 'create') await create();
  else if (command === 'link') await link();
  else if (command === 'remove') await remove();
  else {
    console.log(
      'Usage:\n' +
        '  node scripts/demo-stay.js create [--email=you@example.com]\n' +
        '  node scripts/demo-stay.js link    --email=you@example.com\n' +
        '  node scripts/demo-stay.js remove\n' +
        '\n' +
        '  --ttl-hours=N   how long the sign-in link stays valid (default 168)',
    );
  }
})()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
