#!/usr/bin/env node
/**
 * Finds out what Lodgify's rates calendar actually needs, and prints what it
 * returns.
 *
 * First attempt asked with HouseId + StartDate + EndDate and got back
 * "Request model is not valid. All fields are required." — a 400, not a 404,
 * so the endpoint and the key are fine and something required is missing.
 * Lodgify prices per room type, so that id is the likely omission; the estate's
 * own calendar shows $6,500 a night, which rules out the data being absent.
 *
 * This walks it: read the property, print its currency and room types, then
 * ask for rates with each id until one answers. Whatever works becomes the
 * call in lodgify.service.ts — written against a response, not a document.
 *
 *   node /app/apps/api/scripts/lodgify-rates.js
 *   node /app/apps/api/scripts/lodgify-rates.js 2026-11-01 2026-12-31
 */

const KEY = process.env.LODGIFY_API_KEY;
const PROPERTY = process.env.LODGIFY_PROPERTY_ID;

if (!KEY || !PROPERTY) {
  console.error('LODGIFY_API_KEY and LODGIFY_PROPERTY_ID must be set.');
  process.exit(1);
}

const day = (d) => d.toISOString().slice(0, 10);
const [from, to] = process.argv.slice(2);
const start = from ?? day(new Date());
const end = to ?? day(new Date(Date.now() + 60 * 86_400_000));

async function get(url) {
  const res = await fetch(url, {
    headers: { 'X-ApiKey': KEY, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep the raw text */
  }
  return { status: res.status, body };
}

/** Pull every plausible room-type id out of a property payload. */
function roomTypeIds(property) {
  const ids = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    for (const [k, v] of Object.entries(node)) {
      if (/room_?type_?id/i.test(k) && (typeof v === 'number' || typeof v === 'string')) {
        ids.add(String(v));
      }
      // `rooms: [{ id }]` is how Lodgify usually expresses them.
      if (/^rooms?$/i.test(k) && Array.isArray(v)) {
        for (const r of v) if (r && r.id != null) ids.add(String(r.id));
      }
      visit(v);
    }
  };
  visit(property);
  return [...ids];
}

(async () => {
  console.log(`\n══ Property ${PROPERTY}`);
  const prop = await get(`https://api.lodgify.com/v2/properties/${PROPERTY}`);
  console.log(`   HTTP ${prop.status}`);

  if (prop.status !== 200) {
    console.log(`   ${JSON.stringify(prop.body).slice(0, 300)}`);
    process.exit(1);
  }

  const currencyKeys = ['currency_code', 'currencyCode', 'currency'];
  const currency = currencyKeys
    .map((k) => prop.body?.[k])
    .find((v) => typeof v === 'string');
  console.log(`   currency: ${currency ?? '(not on the property record)'}`);

  const ids = roomTypeIds(prop.body);
  console.log(`   room type ids: ${ids.length ? ids.join(', ') : '(none found)'}`);

  if (ids.length === 0) {
    console.log('\n   No room type id anywhere in the property payload. Printing');
    console.log('   the top-level keys so we can see what it does carry:');
    console.log(`   ${Object.keys(prop.body ?? {}).join(', ')}`);
  }

  // Each candidate, with the parameter names Lodgify's rates family documents.
  for (const roomTypeId of ids) {
    const qs = new URLSearchParams({
      RoomTypeId: roomTypeId,
      HouseId: PROPERTY,
      StartDate: start,
      EndDate: end,
    }).toString();
    const url = `https://api.lodgify.com/v2/rates/calendar?${qs}`;
    console.log(`\n══ Rates with RoomTypeId=${roomTypeId}`);
    console.log(`   ${url}`);

    const res = await get(url);
    console.log(`   HTTP ${res.status}`);

    if (res.status !== 200) {
      console.log(`   ${JSON.stringify(res.body).slice(0, 300)}`);
      continue;
    }

    const payload = res.body;
    const rows = Array.isArray(payload)
      ? payload
      : (payload?.calendar_items ?? payload?.items ?? payload?.data ?? []);

    console.log(`   top-level: ${Array.isArray(payload) ? 'array' : typeof payload}`);
    if (!Array.isArray(payload)) {
      console.log(`   keys: ${Object.keys(payload ?? {}).join(', ')}`);
    }
    console.log(`   rows: ${Array.isArray(rows) ? rows.length : 'not an array'}`);

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('   first three rows verbatim:');
      console.log(JSON.stringify(rows.slice(0, 3), null, 2));
      console.log('\n   ✅ This is the call that works — paste the above back.');
      return;
    }
    console.log('   200 but no rows for this window.');
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
