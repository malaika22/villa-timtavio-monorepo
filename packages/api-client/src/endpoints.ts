export const API = {
  bookings: {
    current: '/api/v1/bookings/current',
    currentActive: '/api/v1/bookings/current-active',
    status: (id: string) => `/api/v1/bookings/${id}/status`,
    approveManifest: (id: string) => `/api/v1/bookings/${id}/approve-manifest`,
  },
  rooms: {
    list: '/api/v1/rooms',
    availability: (bookingId: string) => `/api/v1/rooms/availability/${bookingId}`,
    byNumber: (number: string | number) => `/api/v1/rooms/${number}`,
    toggleActive: (number: string | number) => `/api/v1/rooms/${number}/toggle-active`,
  },
  experienceCategories: {
    list: '/api/v1/experience-categories',
    byId: (id: string) => `/api/v1/experience-categories/${id}`,
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
    importCsv: '/api/v1/catalog/import/csv',
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
    emToday: '/api/v1/requests/em/today',
    emHistory: '/api/v1/requests/em/history',
    approve: (id: string) => `/api/v1/requests/${id}/approve`,
    decline: (id: string) => `/api/v1/requests/${id}/decline`,
    confirmCost: (id: string) => `/api/v1/requests/${id}/confirm-cost`,
  },
  folio: {
    dailyRevenue: '/api/v1/folio/daily-revenue',
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
    lookbookSent: (id: string) => `/api/v1/inquiries/${id}/lookbook-sent`,
    paymentLinkSent: (id: string) => `/api/v1/inquiries/${id}/payment-link-sent`,
    delete: (id: string) => `/api/v1/inquiries/${id}`,
  },
  magicLink: {
    send: (bookingId: string) => `/api/v1/magic-link/send/${bookingId}`,
    resend: (manifestGuestId: string) =>
      `/api/v1/magic-link/resend/${manifestGuestId}`,
    sendAllSecondary: (bookingId: string) =>
      `/api/v1/magic-link/send-all-secondary/${bookingId}`,
  },
  system: {
    lodgifySyncStatus: '/api/v1/system/lodgify-sync-status',
    health: '/api/v1/system/health',
    alerts: '/api/v1/system-alerts',
    dismissAlert: (id: string) => `/api/v1/system-alerts/${id}/dismiss`,
  },
  analytics: {
    overview: (period?: string) =>
      `/api/v1/analytics/overview${period ? `?period=${period}` : ''}`,
    revenueTrend: (year: number, compare?: number) =>
      `/api/v1/analytics/revenue-trend?year=${year}${compare ? `&compare=${compare}` : ''}`,
    occupancy: (period?: string) =>
      `/api/v1/analytics/occupancy${period ? `?period=${period}` : ''}`,
    heatMap: (date?: string, range?: string, category?: string) => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (range) params.set('range', range);
      if (category) params.set('category', category);
      const qs = params.toString();
      return `/api/v1/analytics/heat-map${qs ? `?${qs}` : ''}`;
    },
    peakHours: (date?: string) =>
      `/api/v1/analytics/peak-hours${date ? `?date=${date}` : ''}`,
    experiences: (period?: string) =>
      `/api/v1/analytics/experiences${period ? `?period=${period}` : ''}`,
    upcomingStays: '/api/v1/analytics/upcoming-stays',
    intelligenceAlerts: '/api/v1/analytics/intelligence-alerts',
    satisfaction: '/api/v1/analytics/satisfaction',
    vendors: '/api/v1/analytics/vendors',
    revenueMix: '/api/v1/analytics/revenue-mix',
    occupancyCalendar: '/api/v1/analytics/occupancy-calendar',
    experienceSeasonality: '/api/v1/analytics/experience-seasonality',
    heatMapCell: (space: string, timeBlock: string, date?: string) => {
      const p = new URLSearchParams({ space, timeBlock });
      if (date) p.set('date', date);
      return `/api/v1/analytics/heat-map/cell?${p.toString()}`;
    },
  },
  dashboard: {
    kpis: '/api/v1/dashboard/kpis',
    alertBanner: '/api/v1/dashboard/alert-banner',
    scheduleToday: '/api/v1/dashboard/schedule/today',
    calendar: (start?: string) =>
      `/api/v1/dashboard/calendar${start ? `?start=${start}` : ''}`,
    export: '/api/v1/dashboard/export',
  },
  dining: {
    byBooking: (bookingId: string) =>
      `/api/v1/dining/bookings/${bookingId}`,
    create: (bookingId: string) => `/api/v1/dining/bookings/${bookingId}`,
    confirm: (id: string) => `/api/v1/dining/${id}/confirm`,
    cancel: (id: string) => `/api/v1/dining/${id}/cancel`,
  },
  notifications: {
    list: (bookingId: string) => `/api/v1/notifications/bookings/${bookingId}`,
    unreadCount: (bookingId: string) =>
      `/api/v1/notifications/bookings/${bookingId}/unread-count`,
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: (bookingId: string) =>
      `/api/v1/notifications/bookings/${bookingId}/read-all`,
    pushSubscription: '/api/v1/notifications/push-subscription',
  },
  pusher: {
    auth: '/api/v1/pusher/auth',
    authEm: '/api/v1/pusher/auth-em',
  },
  manifest: {
    options: '/api/v1/manifest/options',
    byBooking: (bookingId: string) => `/api/v1/manifest/${bookingId}`,
    addGuest: (bookingId: string) => `/api/v1/manifest/${bookingId}/guests`,
    updateGuest: (bookingId: string, guestId: string) => `/api/v1/manifest/${bookingId}/guests/${guestId}`,
    removeGuest: (bookingId: string, guestId: string) => `/api/v1/manifest/${bookingId}/guests/${guestId}`,
    submit: (bookingId: string) => `/api/v1/manifest/${bookingId}/submit`,
    approve: (bookingId: string) => `/api/v1/manifest/${bookingId}/approve`,
    chefsBrief: (bookingId: string) => `/api/v1/manifest/${bookingId}/chefs-brief`,
    resendLink: (bookingId: string, guestId: string) => `/api/v1/manifest/${bookingId}/guests/${guestId}/resend-link`,
    linkOpened: '/api/v1/manifest/link-opened',
    draft: (bookingId: string) => `/api/v1/manifest/${bookingId}/draft`,
  },
  auditLog: '/api/v1/audit-log',
  inventory: {
    list: '/api/v1/inventory',
    adjust: (id: string) => `/api/v1/inventory/${id}/adjust`,
    reorder: (id: string) => `/api/v1/inventory/${id}/reorder`,
  },
  settings: {
    get: '/api/v1/settings',
    staff: '/api/v1/settings/staff',
    staffById: (id: string) => `/api/v1/settings/staff/${id}`,
    integrations: '/api/v1/settings/integrations',
  },
} as const;
