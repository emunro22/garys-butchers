export const NOTICE_OPTIONS = [
  { value: 0, label: 'Available same day' },
  { value: 1, label: '1 day notice required' },
  { value: 2, label: '2 days notice required' },
  { value: 3, label: '3 days notice required' },
  { value: 7, label: '1 week notice required' },
] as const;

export function noticeLabel(days: number): string {
  const match = NOTICE_OPTIONS.find((o) => o.value === days);
  if (match) return match.label;
  return days === 1 ? '1 day notice required' : `${days} days notice required`;
}
