#!/usr/bin/env node
/**
 * List, add and remove Lodgify webhook subscriptions.
 *
 * Lodgify has no webhook screen on most plans — subscriptions live on their
 * side, created by an API call, with nothing in this repo recording what was
 * registered or where it points. That makes "which URL is Lodgify actually
 * calling?" unanswerable without asking Lodgify, which is what this does.
 *
 * Plain Node against fetch, matching prisma/scripts: the production shell has
 * no TypeScript runner, and this is exactly the script you want to run there,
 * where LODGIFY_API_KEY already exists.
 *
 *   node scripts/lodgify-webhooks.js list
 *   node scripts/lodgify-webhooks.js subscribe <event> <url>
 *   node scripts/lodgify-webhooks.js unsubscribe <id>
 *
 * One subscription per callback URL: Lodgify answers a second subscribe on the
 * same URL with 409 "This callback url already exists", whatever the event. To
 * receive more than one event, give each its own URL — a query string is enough,
 * since the route ignores it:
 *
 *   .../webhooks/lodgify?event=booking_change
 *
 * Subscribing returns a per-subscription `secret`. It must be set as
 * LODGIFY_WEBHOOK_SECRET on Render or the API rejects every delivery as an
 * invalid signature — quietly, since the 5-minute poller keeps the data current
 * and nothing looks broken.
 *
 * The events this API actually handles (see lodgify-booking.mapper.ts):
 *   booking_new_status_booked, booking_new_any_status,
 *   booking_status_change_booked, booking_change,
 *   booking_status_change_tentative, booking_status_change_open,
 *   booking_status_change_declined
 */

const BASE = 'https://api.lodgify.com/webhooks/v1';
const KEY = process.env.LODGIFY_API_KEY;

if (!KEY) {
  console.error('LODGIFY_API_KEY is not set. Run this on the Render shell.');
  process.exit(1);
}

async function call(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'X-ApiKey': KEY,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let payload = text;
  try {
    payload = JSON.parse(text);
  } catch {
    /* Lodgify sometimes answers in plain text; show it as-is. */
  }

  if (!res.ok) {
    // A 404 here usually means the account's plan doesn't expose webhook
    // management over the API — worth knowing rather than guessing at.
    console.error(`HTTP ${res.status} from ${method} ${path}`);
    console.error(payload);
    process.exit(1);
  }
  return payload;
}

const [command, ...args] = process.argv.slice(2);

(async () => {
  switch (command) {
    case 'list': {
      const subs = await call('/list');
      console.log(JSON.stringify(subs, null, 2));
      break;
    }

    case 'subscribe': {
      const [event, target] = args;
      if (!event || !target) {
        console.error('Usage: subscribe <event> <target_url>');
        process.exit(1);
      }
      const out = await call('/subscribe', 'POST', {
        event,
        target_url: target,
      });
      console.log(`Subscribed ${event} → ${target}`);
      console.log(JSON.stringify(out, null, 2));
      break;
    }

    case 'unsubscribe': {
      const [id] = args;
      if (!id) {
        console.error('Usage: unsubscribe <subscription_id>');
        process.exit(1);
      }
      // DELETE, not POST: Lodgify answers POST /unsubscribe with 405, so the
      // path exists but only accepts the verb that matches what it does.
      await call('/unsubscribe', 'DELETE', { id });
      console.log(`Unsubscribed ${id}`);
      break;
    }

    default:
      console.log(
        'Usage:\n' +
          '  node scripts/lodgify-webhooks.js list\n' +
          '  node scripts/lodgify-webhooks.js subscribe <event> <url>\n' +
          '  node scripts/lodgify-webhooks.js unsubscribe <id>',
      );
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
