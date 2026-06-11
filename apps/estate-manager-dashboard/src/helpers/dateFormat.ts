import { format, parseISO } from 'date-fns';

export function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}
