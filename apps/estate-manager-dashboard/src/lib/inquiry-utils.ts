import type { Inquiry } from '@repo/api-types';
import { format, parseISO } from 'date-fns';

import { config } from '@/config/config';

/** Normalise a pasted social value into a URL — WITHOUT guessing a platform.
 *  Full URLs are kept; a bare "domain/path" gets https prepended; a bare
 *  @handle (no domain) can't be resolved to a real profile without knowing the
 *  platform, so we return null and show it as plain text rather than defaulting
 *  to LinkedIn. */
export function toSocialUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;

  const cleaned = v.replace(/^\/\//, '');
  return cleaned.includes('.') ? `https://${cleaned}` : null;
}

/** "View <platform>" label derived from the social URL, so an Instagram link
 *  isn't labelled "View LinkedIn". Any non-social/unknown link gets a generic
 *  "View link" instead of defaulting to a platform name. */
export function socialLinkLabel(url?: string | null): string {
  if (!url) return 'View link';
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'View Instagram';
  if (u.includes('linkedin.com')) return 'View LinkedIn';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'View X';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'View Facebook';
  if (u.includes('tiktok.com')) return 'View TikTok';
  return 'View link';
}

export function formatInquiryDateRange(inquiry: Inquiry): string {
  if (!inquiry.preferredFrom) return 'Dates flexible';
  try {
    const from = format(parseISO(inquiry.preferredFrom), 'MMMM d, yyyy');
    const to = inquiry.preferredTo
      ? format(parseISO(inquiry.preferredTo), 'MMMM d, yyyy')
      : from;
    return `${from} – ${to}`;
  } catch {
    return 'Dates flexible';
  }
}

/** Public lookbook, linked in the email alongside the attached PDF. */
export const LOOKBOOK_URL = 'https://www.villatimtavio.com/lookbook';

/**
 * The message body Rodrigo sends with the lookbook. Kept separate from the
 * mailto so it can also be copied to the clipboard — `mailto:` only opens
 * anything when the machine has a default mail handler, and webmail users
 * otherwise get nothing at all.
 *
 * The payment link is required by the caller: the Send action is blocked until
 * one is saved, so this never renders a half-finished message.
 */
export function buildLookbookMessage(inquiry: Inquiry): string {
  const dates = formatInquiryDateRange(inquiry);
  const paymentLink = inquiry.stripePaymentLink?.trim();

  const reservationLine = paymentLink
    ? `To confirm your reservation, use the secure payment link below:

${paymentLink}`
    : // Defensive only — the UI blocks Send until a link is saved.
      `We will follow up shortly with a secure payment link to confirm your reservation.`;

  return `Dear ${inquiry.firstName},

Thank you for your interest in Villa TimTavio. We are pleased to share our lookbook and next steps for your stay (${dates}).

You will find the lookbook attached, and you can also view it online at ${LOOKBOOK_URL}

${reservationLine}

We look forward to welcoming you to Puerto Escondido.

Warm regards,
Casa TimTavio Estate Team`;
}

export function buildLookbookSubject(inquiry: Inquiry): string {
  return `Villa TimTavio — Lookbook & reservation details for ${inquiry.firstName}`;
}

export function buildLookbookMailto(inquiry: Inquiry): string {
  const subject = encodeURIComponent(buildLookbookSubject(inquiry));
  const body = encodeURIComponent(buildLookbookMessage(inquiry));
  return `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
}

export const LODGIFY_NEW_BOOKING_URL = config.lodgify.newBookingUrl;
