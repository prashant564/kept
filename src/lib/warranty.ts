import { addDays, addMonths, daysBetween, parseISODate, startOfToday } from './dates';
import type { Item } from './types';

export type CoverageStatus = 'active' | 'expiring' | 'expired' | 'lifetime' | 'none';

/** Days before expiry at which an item counts as "expiring soon". */
export const EXPIRING_WINDOW_DAYS = 60;

export interface Coverage {
  status: CoverageStatus;
  expiresOn: Date | null;
  daysLeft: number | null;
  /** 0..1 share of the warranty period already used. */
  progress: number;
  returnDeadline: Date | null;
  returnDaysLeft: number | null;
  returnOpen: boolean;
}

export function getCoverage(item: Pick<Item, 'purchaseDate' | 'warrantyMonths' | 'returnDays'>): Coverage {
  const today = startOfToday();
  const purchased = parseISODate(item.purchaseDate);

  const returnDeadline = item.returnDays > 0 ? addDays(purchased, item.returnDays) : null;
  const returnDaysLeft = returnDeadline ? daysBetween(today, returnDeadline) : null;
  const returnOpen = returnDaysLeft !== null && returnDaysLeft >= 0;

  if (item.warrantyMonths === -1) {
    return { status: 'lifetime', expiresOn: null, daysLeft: null, progress: 0, returnDeadline, returnDaysLeft, returnOpen };
  }
  if (item.warrantyMonths <= 0) {
    return { status: 'none', expiresOn: null, daysLeft: null, progress: 1, returnDeadline, returnDaysLeft, returnOpen };
  }

  const expiresOn = addMonths(purchased, item.warrantyMonths);
  const daysLeft = daysBetween(today, expiresOn);
  const total = Math.max(1, daysBetween(purchased, expiresOn));
  const progress = Math.min(1, Math.max(0, daysBetween(purchased, today) / total));

  let status: CoverageStatus = 'active';
  if (daysLeft < 0) status = 'expired';
  else if (daysLeft <= EXPIRING_WINDOW_DAYS) status = 'expiring';

  return { status, expiresOn, daysLeft, progress, returnDeadline, returnDaysLeft, returnOpen };
}

export function isCovered(c: Coverage): boolean {
  return c.status === 'active' || c.status === 'expiring' || c.status === 'lifetime';
}

/** Human label for time remaining, e.g. "2 yrs left", "12 days left". */
export function describeRemaining(days: number): string {
  if (days < 0) {
    const ago = Math.abs(days);
    if (ago >= 365) return `Expired ${Math.floor(ago / 365)}y ago`;
    if (ago >= 60) return `Expired ${Math.floor(ago / 30)}mo ago`;
    return `Expired ${ago}d ago`;
  }
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  if (days < 60) return `${days} days left`;
  if (days < 365) return `${Math.floor(days / 30)} months left`;
  const years = days / 365;
  return `${years >= 2 ? Math.floor(years) : years.toFixed(1)} yrs left`;
}

export const WARRANTY_OPTIONS: { label: string; months: number }[] = [
  { label: 'None', months: 0 },
  { label: '6 mo', months: 6 },
  { label: '1 yr', months: 12 },
  { label: '2 yrs', months: 24 },
  { label: '3 yrs', months: 36 },
  { label: '5 yrs', months: 60 },
  { label: 'Lifetime', months: -1 },
];

export const RETURN_OPTIONS: { label: string; days: number }[] = [
  { label: 'None', days: 0 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export function warrantyLabel(months: number): string {
  if (months === -1) return 'Lifetime';
  if (months === 0) return 'No warranty';
  if (months % 12 === 0) return `${months / 12} ${months === 12 ? 'year' : 'years'}`;
  return `${months} months`;
}
