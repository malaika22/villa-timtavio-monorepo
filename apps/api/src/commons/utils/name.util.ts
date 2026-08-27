// Guest names fall back to the literal "Guest" when a booking is created
// without a real name (e.g. a Lodgify sync with no guest name). These helpers
// let guest-facing copy personalize when a real name exists and degrade
// gracefully — never showing the impersonal "Guest" placeholder — otherwise.

// "awaiting guest" is what a reservation Lodgify sent with no guest email is
// held under until somebody fills it in. It has to count as a placeholder like
// the rest: without it a promoted reservation keeps that name for ever, and
// the guest is greeted "Welcome, Awaiting guest."
const PLACEHOLDER_NAMES = new Set(['guest', 'guests', 'awaiting guest', '']);

/** A trimmed first name if it's a real one, otherwise undefined. */
export function realFirstName(firstName?: string | null): string | undefined {
  const name = firstName?.trim();
  if (!name || PLACEHOLDER_NAMES.has(name.toLowerCase())) return undefined;
  return name;
}

/** Full name if real, otherwise undefined (last name is optional). */
export function realFullName(
  firstName?: string | null,
  lastName?: string | null,
): string | undefined {
  const first = realFirstName(firstName);
  if (!first) return undefined;
  const last = lastName?.trim();
  return last ? `${first} ${last}` : first;
}

/** A greeting like "Welcome, Malaika." or a clean "Welcome." when no real name. */
export function greeting(firstName?: string | null): string {
  const name = realFirstName(firstName);
  return name ? `Welcome, ${name}.` : 'Welcome.';
}

/** Best label for "sent to X": real name, else the email. */
export function recipientLabel(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  return realFullName(firstName, lastName) ?? email?.trim() ?? 'the guest';
}
