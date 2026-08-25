/**
 * Formatting a stay date — a calendar date, not a moment in time.
 *
 * Lodgify sends `arrival: "2026-09-17"`, the API stores it with
 * `new Date("2026-09-17")`, and that is midnight **UTC**. Rendered with the
 * browser's own timezone, every viewer west of Greenwich sees the day before:
 * a booking Lodgify calls 17–18 September appeared in Guests as 16–17, and the
 * estate had no way to tell which was true.
 *
 * The stored value is not really an instant. Nobody checks in at midnight; the
 * date means "the 17th" wherever you happen to be reading it. So it is
 * formatted in UTC, which hands back exactly the date Lodgify sent, identically
 * in Puerto Escondido and anywhere else.
 *
 * Use this for checkIn, checkOut and anything else derived from a date-only
 * source. Do NOT use it for real timestamps — createdAt, expiresAt, a hold's
 * countdown — which are genuine instants and belong in the reader's own time.
 */
const opts = (extra: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  timeZone: 'UTC',
  ...extra,
});

/** "17 Sept" */
export const stayDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', opts({ day: 'numeric', month: 'short' }));

/** "Thu 17 Sept 2026" */
export const stayDateLong = (iso: string): string =>
  new Date(iso).toLocaleDateString(
    'en-GB',
    opts({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  );

/** "17 Sept 2026" */
export const stayDateWithYear = (iso: string): string =>
  new Date(iso).toLocaleDateString(
    'en-GB',
    opts({ day: 'numeric', month: 'short', year: 'numeric' }),
  );

/** "17 Sept – 21 Sept 2026" */
export const stayRange = (checkIn?: string, checkOut?: string): string => {
  if (!checkIn || !checkOut) return 'Dates TBD';
  return `${stayDate(checkIn)} – ${stayDateWithYear(checkOut)}`;
};

/**
 * Nights between two stay dates.
 *
 * Both are UTC midnight, so the difference is exact — no daylight-saving hour
 * can creep in and turn six nights into 5.958.
 */
export const stayNights = (checkIn: string, checkOut: string): number =>
  Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86_400_000);
