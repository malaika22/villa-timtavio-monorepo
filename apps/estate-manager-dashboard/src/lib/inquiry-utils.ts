import type { Inquiry } from '@repo/api-types';
import { format, parseISO } from 'date-fns';

import { config } from '@/config/config';

export function toLinkedInUrl(handle?: string | null): string | null {
  if (!handle?.trim()) return null;

  const value = handle.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.includes('linkedin.com')) {
    return `https://${value.replace(/^\/\//, '')}`;
  }

  const slug = value.replace(/^@/, '').replace(/^in\//, '');
  return `https://www.linkedin.com/in/${slug}`;
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

export function buildLookbookMailto(inquiry: Inquiry): string {
  const subject = encodeURIComponent(
    `Villa TimTavio — Lookbook & reservation details for ${inquiry.firstName}`,
  );
  const dates = formatInquiryDateRange(inquiry);
  const body = encodeURIComponent(
    `Dear ${inquiry.firstName},

Thank you for your interest in Villa TimTavio. We are pleased to share our lookbook and next steps for your stay (${dates}).

Please find the lookbook attached, along with the secure payment link to confirm your reservation.

We look forward to welcoming you to Puerto Escondido.

Warm regards,
Casa TimTavio Estate Team`,
  );

  return `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
}

export const LODGIFY_NEW_BOOKING_URL = config.lodgify.newBookingUrl;
