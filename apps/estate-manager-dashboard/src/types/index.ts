import { BookingStatus } from '@repo/api-types';

export type GuestStayStatus =
  | 'Settled'
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
    experiences: string;
    folioTotal: string;
  }[];
  activeBookingId?: string | null;
  bookingStatus?: BookingStatus;
  totalVisits?: number;
  lifetimeSpend?: number;
  specialOccasions?: string | null;
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
  basePrice?: number | null;
  vendorId?: string | null;
  breezeWayTeamId?: string | null;
  primaryPhotoUrl?: string | null;
  maxGuestCount?: number | null;
  included?: string[];
  hostName?: string | null;
  hostTitle?: string | null;
  hostAvatarUrl?: string | null;
  hostReviewNote?: string | null;
  imageTone?: 'dining' | 'water' | 'wellness' | 'wine' | 'culture' | 'inactive';
};
