export const API = {
  bookings: {
    current: '/api/v1/bookings/current',
    status: (id: string) => `/api/v1/bookings/${id}/status`,
    approveManifest: (id: string) => `/api/v1/bookings/${id}/approve-manifest`,
  },
  rooms: {
    list: '/api/v1/rooms',
    availability: (bookingId: string) => `/api/v1/rooms/availability/${bookingId}`,
    byNumber: (number: string) => `/api/v1/rooms/${number}`,
    toggleActive: (number: string) => `/api/v1/rooms/${number}/toggle-active`,
  },
  catalog: {
    list: '/api/v1/catalog',
    included: '/api/v1/catalog/included',
    menus: '/api/v1/catalog/menus',
    recommendations: '/api/v1/catalog/recommendations',
    detail: (id: string) => `/api/v1/catalog/${id}/detail`,
    byId: (id: string) => `/api/v1/catalog/${id}`,
    adminAll: '/api/v1/catalog/admin/all',
    toggleActive: (id: string) => `/api/v1/catalog/${id}/toggle-active`,
    menuById: (id: string) => `/api/v1/catalog/menus/${id}`,
    recommendationById: (id: string) => `/api/v1/catalog/recommendations/${id}`,
  },
  requests: {
    create: (bookingId: string) => `/api/v1/requests/bookings/${bookingId}`,
    byBooking: (bookingId: string) => `/api/v1/requests/bookings/${bookingId}`,
    pendingApproval: (bookingId: string) =>
      `/api/v1/requests/bookings/${bookingId}/pending-approval`,
    primaryApprove: (id: string) => `/api/v1/requests/${id}/primary-approve`,
    primaryDecline: (id: string) => `/api/v1/requests/${id}/primary-decline`,
    byId: (id: string) => `/api/v1/requests/${id}`,
    emQueue: '/api/v1/requests/em/queue',
    emActive: '/api/v1/requests/em/active',
    approve: (id: string) => `/api/v1/requests/${id}/approve`,
    decline: (id: string) => `/api/v1/requests/${id}/decline`,
    confirmCost: (id: string) => `/api/v1/requests/${id}/confirm-cost`,
  },
  folio: {
    byBooking: (bookingId: string) => `/api/v1/folio/${bookingId}`,
    charges: (bookingId: string) => `/api/v1/folio/${bookingId}/charges`,
    chargeById: (itemId: string) => `/api/v1/folio/charges/${itemId}`,
    checkout: (bookingId: string) => `/api/v1/folio/${bookingId}/checkout`,
  },
  guests: {
    current: '/api/v1/guests/current',
    upcoming: '/api/v1/guests/upcoming',
    past: '/api/v1/guests/past',
    profile: (id: string) => `/api/v1/guests/${id}/profile`,
    dna: (id: string) => `/api/v1/guests/${id}/dna`,
  },
  crm: {
    notes: (guestId: string) => `/api/v1/crm/guests/${guestId}/notes`,
    noteStale: (noteId: string) => `/api/v1/crm/notes/${noteId}/stale`,
    beveragePreference: (guestId: string) =>
      `/api/v1/crm/guests/${guestId}/beverage-preference`,
    dietaryRestriction: (guestId: string) =>
      `/api/v1/crm/guests/${guestId}/dietary-restriction`,
    preStockSuggestions: (guestId: string) =>
      `/api/v1/crm/guests/${guestId}/pre-stock-suggestions`,
    experienceHistory: (guestId: string) =>
      `/api/v1/crm/guests/${guestId}/experience-history`,
  },
  vendors: {
    list: '/api/v1/vendors',
    byId: (id: string) => `/api/v1/vendors/${id}`,
    status: (id: string) => `/api/v1/vendors/${id}/status`,
    ratings: '/api/v1/vendors/ratings',
  },
  inquiries: {
    list: '/api/v1/inquiries',
    create: '/api/v1/inquiries',
    byId: (id: string) => `/api/v1/inquiries/${id}`,
    approve: (id: string) => `/api/v1/inquiries/${id}/approve`,
    decline: (id: string) => `/api/v1/inquiries/${id}/decline`,
  },
  manifest: {
    linkOpen: '/api/v1/manifest/link-open',
  },
} as const;
