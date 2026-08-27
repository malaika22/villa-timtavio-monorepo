/**
 * Formatting a stay date — a calendar date, not a moment in time.
 *
 * Lodgify sends `arrival: "2026-09-18"`, the API stores it with
 * `new Date("2026-09-18")`, and that is midnight **UTC**. Rendered with the
 * browser's own timezone, every viewer west of Greenwich sees the day before:
 * a reservation Lodgify calls 18–20 September showed on the guest's home
 * screen as 17–19, and the guest had no way to tell which was true.
 *
 * The stored value is not really an instant. Nobody checks in at midnight; the
 * date means "the 18th" wherever you happen to be reading it. So it is
 * formatted in UTC, which hands back exactly the date Lodgify sent —
 * identically in Puerto Escondido, Karachi and anywhere else.
 *
 * The estate-manager dashboard already has this file; the guest app never got
 * it, which is why the two disagreed about the same booking.
 *
 * Use this for checkIn, checkOut, a menu day, a requested experience date —
 * anything derived from a date-only source. Do NOT use it for real timestamps
 * (createdAt, loggedAt, a cutoff) which are genuine instants and belong in the
 * reader's own time.
 */
const utc = (
  extra: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions => ({
  timeZone: 'UTC',
  ...extra,
});

/** "September 18" */
export const stayDateLong = (iso: string): string =>
  new Date(iso).toLocaleDateString(
    'en-US',
    utc({ month: 'long', day: 'numeric' }),
  );

/** "Sep 18" */
export const stayDateShort = (iso: string): string =>
  new Date(iso).toLocaleDateString(
    'en-US',
    utc({ month: 'short', day: 'numeric' }),
  );

/** "Thu, Sep 18" */
export const stayDateWithWeekday = (iso: string): string =>
  new Date(iso).toLocaleDateString(
    'en-US',
    utc({ weekday: 'short', month: 'short', day: 'numeric' }),
  );

/** "Thu" */
export const stayWeekdayShort = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', utc({ weekday: 'short' }));

/** "Thursday" */
export const stayWeekdayLong = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', utc({ weekday: 'long' }));

/** "18" */
export const stayDayOfMonth = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', utc({ day: 'numeric' }));

/**
 * Whole days from today to a stay date.
 *
 * Today is the reader's own calendar day — the guest in Mexico and the guest
 * in Karachi each mean their own "today" — and it is compared against the
 * stay's UTC date. Doing this with local Date arithmetic is what made the
 * countdown agree with the wrong date rather than the right one.
 */
export const stayDaysUntil = (iso: string): number => {
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(iso).getTime() - todayUtc) / 86_400_000);
};
