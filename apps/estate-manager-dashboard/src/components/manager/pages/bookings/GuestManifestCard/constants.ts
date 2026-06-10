export const STATUS_LABELS: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  INCOMPLETE: {
    label: 'Incomplete',
    bg: '#fef9e7',
    dot: '#e67e22',
    text: '#9a6a23',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: '#fef9e7',
    dot: '#e67e22',
    text: '#9a6a23',
  },
  SUBMITTED: {
    label: 'Submitted',
    bg: '#e8f1e9',
    dot: '#4a7c59',
    text: '#3a6448',
  },
  APPROVED: {
    label: 'Approved',
    bg: '#e8f1e9',
    dot: '#4a7c59',
    text: '#3a6448',
  },
};
