import { BookingStatus, ManifestStatus, PriceUnit } from '@repo/api-types';

export type GuestStayStatus =
  | 'Settled'
  | 'Checked in'
  | 'Departing'
  | 'Arriving'
  | 'Departed';

export type GuestListStatus = GuestStayStatus;

export type GuestListItem = {
  id: string;
  name: string;
  initials: string;
  villa: string;
  dates: string;
  /** ISO check-in, for ordering. `dates` is formatted for reading, not sorting. */
  checkIn?: string;
  partySize: number;
  memberSince?: string;
  status: GuestListStatus;
  isPast?: boolean;
  activeBookingId?: string | null;
};

export type GuestStayActivityStatus = 'Completed' | 'Pending' | 'Conflict';

export type GuestDNAProfile = {
  id: string;
  name: string;
  initials: string;
  summary: string;
  email?: string;
  phone?: string | null;
  tags: string[];
  dietary: string[];
  beverage: string[];
  experiencePrefs: string[];
  roomSetup: { label: string; value: string }[];
  staffNote: { text: string; author: string; date: string };
  stayActivity: {
    id: string;
    experience: string;
    date: string;
    status: GuestStayActivityStatus;
  }[];
  stayHistory: {
    id: string;
    visit: string;
    isCurrent?: boolean;
    villa: string;
    duration: string;
    /** What became of the stay — checked out, cancelled, still to come. */
    outcome: string;
    folioTotal: string;
  }[];
  activeBookingId?: string | null;
  bookingStatus?: BookingStatus;
  /**
   * The stay this guest is here for, or next arriving on.
   *
   * The mapper used to find this booking, keep its id and status, and throw
   * the rest away — so the panel could act on a stay it could not show you.
   */
  stay?: {
    id: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalGuests: number;
    roomNumber: number | null;
    manifestStatus: ManifestStatus;
    status: BookingStatus;
  } | null;
  totalVisits?: number;
  lifetimeSpend?: number;
  specialOccasions?: string | null;
  /**
   * The editable record behind the display fields above.
   *
   * `dietary` and `beverage` are formatted for reading; these are what the
   * guest actually has stored, and what the editor writes back. Keeping them
   * apart stops a display tweak silently rewriting a guest's allergy.
   */
  raw?: {
    allergies?: string | null;
    beveragePreferences?: string | null;
    winePreferences?: string | null;
    dietaryRestrictions?: string[];
    favouriteExperiences?: string[];
    preferredTimes?: string | null;
    pillarPreferences?: string | null;
  };
  preStock?: { description: string; source: string }[];
};

export type ApprovalStatus = 'Pending' | 'Conflict';

export type ApprovalQueueStatus =
  | 'Conflict'
  | 'Pending'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Declined';

export type ApprovalFilterTab =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'declined';

/**
 * How far ahead the queue looks. Every other filter is categorical, so without
 * this one "All" is unbounded by construction and grows with every stay ever
 * booked — the horizon is what actually keeps the page finite.
 */
export type ApprovalHorizon = 'week' | 'month' | 'upcoming' | 'past' | 'all';

import type { VendorStage } from '@repo/api-types';

export type ApprovalQueueItem = {
  id: string;
  guestName: string;
  initials: string;
  partyLabel: string;
  experience: string;
  experienceDetail: string;
  villa: string;
  requestedDate: string;
  requestedTime: string;
  vendor: string;
  submitted: string;
  status: ApprovalQueueStatus;
  declineReason?: string | null;
  conflictReason?: string | null;
  /**
   * Estimate the guest was shown and the primary approved. The quote dialog
   * measures the entered figure against this, since landing materially above it
   * sends the quote back to the primary instead of straight to the folio.
   */
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  priceUnitCode?: string | null;
  /** Set once a price has been agreed — then IT is the re-approval baseline. */
  confirmedCost?: number | null;
  /**
   * Where this sits with its vendor. `NONE` is everything the estate runs
   * itself — most of the catalogue — and those never wait on anybody.
   */
  vendorStage: VendorStage;
  vendorName?: string | null;
  vendorAskedAt?: string | null;
  vendorNote?: string | null;
  /** A time the vendor offered instead, waiting on the guest. */
  vendorProposedDate?: string | null;
  vendorProposedTime?: string | null;
  /** A finished experience with a vendor and no rating yet. */
  awaitingVendorRating?: boolean;
  /**
   * The stay this belongs to. The queue groups by booking rather than by guest
   * because a party's secondaries are not separate customers — the primary
   * carries every charge, so splitting them apart hides who is liable.
   */
  bookingId: string;
  /** The primary member's name — the stay is known by theirs, not the requester's. */
  stayLabel: string;
  /** e.g. "Aug 3 – Aug 16, 2026". Empty when the booking didn't come back. */
  stayDates: string;
  /** Check-in, ISO. Orders the groups so the soonest arrival leads. */
  stayCheckIn: string | null;
  /**
   * When the experience actually happens, ISO — the confirmed date if there is
   * one, otherwise what the guest asked for. Drives both the in-group order and
   * the horizon filter; `requestedDate` is display text and can't be compared.
   */
  experienceDate: string | null;
};

export type CurrentGuest = {
  id: string;
  bookingId: string;
  name: string;
  initials: string;
  partySize: number;
  villa: string;
  checkout: string;
  status: GuestStayStatus;
  bookingStatus: BookingStatus;
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  variant: 'default' | 'confirmed' | 'pending' | 'conflict';
  /** Tailwind bg-* class for timeline dot */
  dotClass?: string;
};

export type PendingApproval = {
  id: string;
  guestName: string;
  initials: string;
  villa: string;
  experience: string;
  vendor: string;
  requestedTime: string;
  submitted: string;
  status: ApprovalStatus;
};

export type ManagerGuest = {
  id: string;
  name: string;
  initials: string;
  partySize: number;
  villa: string;
  checkIn: string;
  checkout: string;
  status: GuestStayStatus;
};

export type ManagerVendor = {
  id: string;
  name: string;
  service: string;
  contact: string;
  nextVisit: string;
  status: 'Active' | 'Scheduled' | 'Inactive';
};

export type VendorCategory =
  | 'culinary'
  | 'wellness'
  | 'water-sports'
  | 'marine'
  | 'entertainment'
  | 'transport';

export type VendorFilterTab = 'all' | VendorCategory;

export type VendorProfile = {
  id: string;
  name: string;
  category: VendorCategory;
  categoryLabel: string;
  rating: number;
  lead: string;
  location: string;
  description: string;
  serviceTags: string[];
  totalBookings: number;
  avgRating: number;
  avgBooking: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
};

export type BookingTab = 'current' | 'upcoming' | 'past' | 'manifest';

export type ExperienceRequestStatus = 'Pending' | 'Complimentary' | 'Confirmed';

export type ChecklistItemStatus = 'completed' | 'pending' | 'upcoming';

export type CurrentBooking = {
  id: string;
  guestName: string;
  initials: string;
  dates: string;
  nights: number;
  guests: number;
  rooms: number;
  arrivesIn: string;
  tags: string[];
  status: string;
  manifestAlert: string;
  roomsManifest: { id: string; label: string; guestCount: number }[];
  manifestProgress: { added: number; total: number };
  experiences: {
    id: string;
    name: string;
    date: string;
    status: ExperienceRequestStatus;
  }[];
  dietary: string[];
  dietaryAlert?: string;
  beverages: string[];
  roomSetup: string;
  staffNote: { text: string; attribution: string };
  checklist: {
    id: string;
    title: string;
    detail?: string;
    status: ChecklistItemStatus;
  }[];
};

export type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  villa: string;
  type: 'Experience' | 'Vendor' | 'Guest';
};

export type CalendarTimelineEventType =
  | 'occupancy'
  | 'experience'
  | 'arrival'
  | 'departure';

export type ContentCatalogTab = 'experiences' | 'menus' | 'recommendations';

export type ContentExperienceCategory =
  | 'dining'
  | 'water'
  | 'wellness'
  | 'wine'
  | 'culture';

export type ContentPricingType = 'chargeable' | 'included';

export type ContentExperience = {
  id: string;
  name: string;
  category: ContentExperienceCategory;
  categoryLabel: string;
  categorySlug?: string;
  experienceCategoryId?: string | null;
  description?: string;
  pricing: ContentPricingType;
  active: boolean;
  capacity: string;
  duration: string;
  durationMinutes?: number | null;
  /** Estimated rate — single estimate, or the low end when priceMax is set. */
  basePrice?: number | null;
  /** High end of a published estimate range. */
  priceMax?: number | null;
  priceUnitId?: string | null;
  priceUnit?: PriceUnit | null;
  vendorId?: string | null;
  breezeWayTeamId?: string | null;
  /** Whether a Breezeway setup task is created when this is confirmed. */
  needsSetupTask?: boolean;
  primaryPhotoUrl?: string | null;
  photoUrls?: string[];
  maxGuestCount?: number | null;
  included?: string[];
  hostName?: string | null;
  hostTitle?: string | null;
  hostAvatarUrl?: string | null;
  hostReviewNote?: string | null;
  imageTone?: 'dining' | 'water' | 'wellness' | 'wine' | 'culture' | 'inactive';
};
