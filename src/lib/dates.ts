const DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO yyyy-mm-dd string as a local-midnight Date. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Adds calendar months, clamping to the last day of the target month. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Whole days from `from` to `to` (negative if `to` is in the past). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY);
}

const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: Date): string {
  return `${date.getDate()} ${monthShort[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${monthShort[date.getMonth()]}`;
}
