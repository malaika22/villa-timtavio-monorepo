import { isFuture, isToday, parseISO } from 'date-fns';

/**
 * Split data into:
 * - current: items for today or past
 * - upcoming: items for tomorrow and later future dates
 */
export const groupItemsByUpcoming = <T extends { scheduledTime: string }>(
  items: T[],
) => {
  const current: T[] = [];
  const upcoming: T[] = [];

  items.forEach((item) => {
    const date = parseISO(item.scheduledTime);

    // Tomorrow or any future date after today
    if (!isToday(date) && isFuture(date)) {
      upcoming.push(item);
    } else {
      current.push(item);
    }
  });

  return { current, upcoming };
};
