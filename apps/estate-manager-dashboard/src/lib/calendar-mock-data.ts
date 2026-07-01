// Static legend config for the (live) week calendar. The calendar itself is
// driven by useCalendar → GET /api/v1/dashboard/calendar.
export const calendarLegendItems = [
  { type: 'occupancy' as const, label: 'Occupancy' },
  { type: 'experience' as const, label: 'Experience' },
  { type: 'arrival' as const, label: 'Arrival' },
  { type: 'departure' as const, label: 'Departure' },
];
