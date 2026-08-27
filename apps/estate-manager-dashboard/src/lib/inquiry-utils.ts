import type { Inquiry } from '@repo/api-types';
import { format, parseISO } from 'date-fns';

import { config } from '@/config/config';
import { stayDateFullMonth } from '@/lib/stay-date';

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
    const from = stayDateFullMonth(inquiry.preferredFrom);
    const to = inquiry.preferredTo
      ? stayDateFullMonth(inquiry.preferredTo)
      : from;
    return `${from} – ${to}`;
  } catch {
    return 'Dates flexible';
  }
}

export const LODGIFY_NEW_BOOKING_URL = config.lodgify.newBookingUrl;
