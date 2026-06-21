export type InquiryStatus = 'NEW' | 'APPROVED' | 'DECLINED' | 'CONVERTED';

export type PurposeOfStay =
  | 'CORPORATE_RETREAT'
  | 'FAMILY'
  | 'WEDDING'
  | 'CONTENT_PRODUCTION'
  | 'OTHER';

export interface Inquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  preferredFrom?: string | null;
  preferredTo?: string | null;
  guestCount?: number | null;
  purposeOfStay?: PurposeOfStay | null;
  socialHandle?: string | null;
  source?: string | null;
  message?: string | null;
  status: InquiryStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  declineReason?: string | null;
  convertedToBookingId?: string | null;
  notes?: string | null;
  lookbookSentAt?: string | null;
  lookbookSentBy?: string | null;
  paymentLinkSentAt?: string | null;
  paymentLinkSentBy?: string | null;
  stripePaymentLink?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryLinkedBooking {
  id: string;
  lodgifyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
  status: string;
  primaryGuest: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InquiryDetail extends Inquiry {
  linkedBooking?: InquiryLinkedBooking | null;
}

export interface CreateInquiryDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredFrom?: string;
  preferredTo?: string;
  guestCount?: number;
  purposeOfStay?: PurposeOfStay;
  socialHandle?: string;
  source?: string;
  message?: string;
}

export interface ReviewInquiryDto {
  notes?: string;
}

export interface DeclineInquiryDto {
  declineReason?: string;
}

export interface MarkPaymentLinkSentDto {
  stripePaymentLink?: string;
}

export interface SendMagicLinkResponse {
  success: boolean;
  sentTo: string;
  message: string;
}
