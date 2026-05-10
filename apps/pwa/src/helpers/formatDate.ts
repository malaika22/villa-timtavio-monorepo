import { format, isTomorrow, isToday, parseISO } from 'date-fns';

export type Item = {
  id: string;
  timestamp: string; // ISO string in UTC
};

/**
 * Format timestamp as:
 * - Today      -> "Today · 7:00 PM"      (optional, if you want to support it)
 * - Tomorrow   -> "Tomorrow · 7:00 PM"
 * - Future     -> "MAR 27 · 6:30 PM"
 */
export const formatTimeLabel = (timestamp: string) => {
  const date = parseISO(timestamp);

  if (isTomorrow(date)) {
    return `Tomorrow · ${format(date, 'h:mm a')}`;
  }

  if (isToday(date)) {
    return `Today · ${format(date, 'h:mm a')}`;
  }

  return `${format(date, 'MMM d').toUpperCase()} · ${format(date, 'h:mm a')}`;
};
