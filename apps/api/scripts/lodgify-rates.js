#!/usr/bin/env node
/**
 * Dumps Lodgify's rates calendar verbatim.
 *
 * The broker calendar reads nightly rates through getNightlyRates(), which was
 * written against Lodgify's documented shape and has never once returned data —
 * the estate hasn't entered rates yet. Building a per-date pricing UI on a
 * payload nobody has seen is how the availability bug happened: the period end
 * date was assumed exclusive, it was inclusive, and every booking's last night
 * came back on the market.
 *
 * So: print exactly what Lodgify sends, and write the parser against that.
 *
 *   node scripts/lodgify-rates.js            # next 60 days
 *   node scripts/lodgify-rates.js 2026-11-01 2026-12-31
 */

const KEY = process.env.LODGIFY_API_KEY;
const PROPERTY = process.env.LODGIFY_PROPERTY_ID;

if (!KEY) {
  console.error('LODGIFY_API_KEY is not set. Run this on the Render shell.');
  process.exit(1);
}

const day = (d) => d.toISOString().slice(0, 10);
const [from, to] = process.argv.slice(2);
const start = from ?? day(new Date());
const end = to ?? day(new Date(Date.now() + 60 * 86_400_000));

(async () => {
  // Both spellings are tried because Lodgify's v2 endpoints are inconsistent
  // about casing between the rates and availability families, and a 404 here
  // is indistinguishable from "no rates set" unless we rule the other out.
  const attempts = [
    { HouseId: PROPERTY, StartDate: start, EndDate: end },
    { propertyId: PROPERTY, start, end },
  ];

  for (const params of attempts) {
    const qs = new URLSearchParams(params).toString();
    const url = `https://api.lodgify.com/v2/rates/calendar?${qs}`;
    console.log(`\n── GET ${url}`);

    const res = await fetch(url, {
      headers: { 'X-ApiKey': KEY, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    console.log(`   HTTP ${res.status}`);

    if (!res.ok) {
      console.log(`   ${text.slice(0, 300)}`);
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      console.log(`   (not JSON) ${text.slice(0, 300)}`);
      continue;
    }

    // The envelope matters as much as the rows — an array and a wrapped
    // { calendar_items: [...] } need different handling downstream.
    console.log(`   top-level: ${Array.isArray(payload) ? 'array' : typeof payload}`);
    if (!Array.isArray(payload)) {
      console.log(`   keys: ${Object.keys(payload).join(', ')}`);
    }

    const rows = Array.isArray(payload)
      ? payload
      : (payload.calendar_items ?? payload.items ?? payload.data ?? []);

    console.log(`   rows: ${Array.isArray(rows) ? rows.length : 'not an array'}`);
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('   first three rows verbatim:');
      console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    } else {
      console.log('   No rows. Either no rates are configured for this window,');
      console.log('   or the parameter names above are wrong for this account.');
    }
    return;
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
