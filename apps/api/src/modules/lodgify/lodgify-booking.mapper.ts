/** Lodgify webhook + API booking shapes → internal sync format */

export type LodgifySyncPayload = {
  id: string;
  arrival: string;
  departure: string;
  nights: number;
  people_count: number;
  total_price: number;
  guest: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  };
};

export type LodgifyWebhookEntry = {
  action: string;
  booking?: Record<string, unknown>;
  guest?: Record<string, unknown>;
  raw: Record<string, unknown>;
};

const BOOKING_CREATE_EVENTS = new Set([
  'booking_new_status_booked',
  'booking_new_any_status',
  'booking_status_change_booked',
  'reservation.created',
]);

const BOOKING_UPDATE_EVENTS = new Set([
  'booking_change',
  'booking_status_change_tentative',
  'booking_status_change_open',
  'reservation.updated',
]);

const BOOKING_CANCEL_EVENTS = new Set([
  'booking_status_change_declined',
  'reservation.cancelled',
]);

export function isLodgifyBookingCreateEvent(event: string): boolean {
  return BOOKING_CREATE_EVENTS.has(event);
}

export function isLodgifyBookingUpdateEvent(event: string): boolean {
  return BOOKING_UPDATE_EVENTS.has(event);
}

export function isLodgifyBookingCancelEvent(event: string): boolean {
  return BOOKING_CANCEL_EVENTS.has(event);
}

/** Lodgify v1 POSTs an array; older docs use a single object. */
export function parseLodgifyWebhookPayload(body: unknown): LodgifyWebhookEntry[] {
  const items = Array.isArray(body) ? body : [body];

  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      action: String(
        item.action ?? item.event ?? item.Event ?? 'unknown',
      ),
      booking:
        item.booking && typeof item.booking === 'object'
          ? (item.booking as Record<string, unknown>)
          : undefined,
      guest:
        item.guest && typeof item.guest === 'object'
          ? (item.guest as Record<string, unknown>)
          : undefined,
      raw: item,
    }));
}

export function extractBookingIdFromWebhook(
  body: Record<string, unknown>,
): string | null {
  const booking =
    body.booking && typeof body.booking === 'object'
      ? (body.booking as Record<string, unknown>)
      : null;

  const data =
    body.data && typeof body.data === 'object'
      ? (body.data as Record<string, unknown>)
      : null;

  const candidates = [
    booking?.id,
    booking?.booking_id,
    data?.bookingId,
    data?.booking_id,
    data?.id,
    body.bookingId,
    body.booking_id,
    body.id,
  ];

  for (const value of candidates) {
    if (value != null && String(value).trim()) {
      return String(value);
    }
  }

  return null;
}

export function normalizeLodgifyWebhookEntry(
  entry: LodgifyWebhookEntry,
): LodgifySyncPayload | null {
  if (entry.booking) {
    const roomTypes = Array.isArray(entry.booking.room_types)
      ? entry.booking.room_types
      : [];
    const firstRoom =
      roomTypes[0] && typeof roomTypes[0] === 'object'
        ? (roomTypes[0] as Record<string, unknown>)
        : null;
    const guestBreakdown =
      firstRoom?.guest_breakdown &&
      typeof firstRoom.guest_breakdown === 'object'
        ? (firstRoom.guest_breakdown as Record<string, unknown>)
        : null;
    const totalTransactions =
      entry.raw.total_transactions &&
      typeof entry.raw.total_transactions === 'object'
        ? (entry.raw.total_transactions as Record<string, unknown>)
        : null;

    return normalizeLodgifyBooking({
      id: entry.booking.id,
      arrival: entry.booking.date_arrival ?? entry.booking.arrival,
      departure: entry.booking.date_departure ?? entry.booking.departure,
      nights: entry.booking.nights,
      people_count:
        firstRoom?.people ??
        guestBreakdown?.adults ??
        entry.booking.people_count,
      total_price:
        entry.raw.booking_total_amount ??
        totalTransactions?.amount ??
        entry.booking.total_price,
      guest: entry.guest,
      guest_name: entry.guest?.name,
      guest_email: entry.guest?.email,
      guest_phone: entry.guest?.phone_number ?? entry.guest?.phone,
    });
  }

  return normalizeLodgifyBooking(entry.raw);
}

function splitGuestName(fullName?: string | null): {
  first_name: string;
  last_name: string;
} {
  if (!fullName?.trim()) {
    return { first_name: 'Guest', last_name: '' };
  }

  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? 'Guest',
    last_name: parts.slice(1).join(' ') || '',
  };
}

function diffNights(arrival: string, departure: string): number {
  const start = new Date(arrival);
  const end = new Date(departure);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function normalizeLodgifyBooking(
  raw: Record<string, unknown>,
): LodgifySyncPayload | null {
  const id = raw.id ?? raw.booking_id ?? raw.bookingId;
  const arrival = (raw.arrival ??
    raw.date_arrival ??
    raw.check_in ??
    raw.checkIn) as string | undefined;
  const departure = (raw.departure ??
    raw.date_departure ??
    raw.check_out ??
    raw.checkOut) as string | undefined;

  if (id == null || !arrival || !departure) {
    return null;
  }

  const guestObj =
    raw.guest && typeof raw.guest === 'object'
      ? (raw.guest as Record<string, unknown>)
      : null;

  // Lodgify's /reservations/bookings payload puts the party size under
  // rooms[].guest_breakdown / rooms[].people (not a top-level people_count).
  const rooms = Array.isArray(raw.rooms)
    ? (raw.rooms as Record<string, unknown>[])
    : [];
  const firstRoom =
    rooms[0] && typeof rooms[0] === 'object' ? rooms[0] : null;
  const roomBreakdown =
    firstRoom?.guest_breakdown && typeof firstRoom.guest_breakdown === 'object'
      ? (firstRoom.guest_breakdown as Record<string, unknown>)
      : null;
  const roomsPeople = rooms.reduce(
    (sum, r) => sum + Number((r as Record<string, unknown>)?.people ?? 0),
    0,
  );

  const guestBreakdown =
    (raw.guests && typeof raw.guests === 'object'
      ? (raw.guests as Record<string, unknown>)
      : null) ?? roomBreakdown;

  const nameFromGuest = splitGuestName(
    (guestObj?.name as string | undefined) ??
      (raw.guest_name as string | undefined) ??
      (raw.guestName as string | undefined),
  );

  const email =
    (guestObj?.email as string | undefined) ??
    (raw.guest_email as string | undefined) ??
    (raw.guestEmail as string | undefined) ??
    (raw.customer &&
    typeof raw.customer === 'object' &&
    (raw.customer as Record<string, unknown>).email
      ? String((raw.customer as Record<string, unknown>).email)
      : undefined);

  if (!email?.trim()) {
    return null;
  }

  const adults = Number(guestBreakdown?.adults ?? raw.adults ?? 0);
  const children = Number(guestBreakdown?.children ?? raw.children ?? 0);
  const infants = Number(guestBreakdown?.infants ?? 0);
  const peopleCount =
    Number(raw.people_count ?? raw.peopleCount ?? raw.total_guests ?? 0) ||
    (roomsPeople > 0 ? roomsPeople : 0) ||
    (adults + children + infants > 0 ? adults + children + infants : 1);

  const nights =
    Number(raw.nights ?? 0) || diffNights(String(arrival), String(departure));

  const totalPrice = Number(
    raw.total_price ??
      raw.totalPrice ??
      raw.total_amount ??
      raw.totalAmount ??
      raw.amount ??
      0,
  );

  return {
    id: String(id),
    arrival: String(arrival),
    departure: String(departure),
    nights,
    people_count: peopleCount,
    total_price: totalPrice,
    guest: {
      email: email.trim(),
      first_name:
        (guestObj?.first_name as string | undefined) ??
        (guestObj?.firstName as string | undefined) ??
        nameFromGuest.first_name,
      last_name:
        (guestObj?.last_name as string | undefined) ??
        (guestObj?.lastName as string | undefined) ??
        nameFromGuest.last_name,
      phone:
        (guestObj?.phone_number as string | undefined) ??
        (guestObj?.phone as string | undefined) ??
        (raw.guest_phone as string | undefined) ??
        (raw.guestPhone as string | undefined) ??
        null,
    },
  };
}
