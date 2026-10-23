export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'JPY', 'INR'] as const;

export function formatMoney(amount: number | null, currency: string, compact = false): string {
  if (amount === null || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: compact || Number.isInteger(amount) ? 0 : 2,
      notation: compact && amount >= 100000 ? 'compact' : 'standard',
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Sums prices without mixing currencies. Returns the total for `preferred` when
 * any item uses it, otherwise for the currency with the most items.
 */
export function primaryTotal(
  items: { price: number | null; currency: string }[],
  preferred: string,
): { amount: number; currency: string; mixed: boolean } {
  const totals = new Map<string, { amount: number; count: number }>();
  for (const i of items) {
    const t = totals.get(i.currency) ?? { amount: 0, count: 0 };
    t.amount += i.price ?? 0;
    t.count += 1;
    totals.set(i.currency, t);
  }
  let currency = preferred;
  if (!totals.has(preferred)) {
    let best = -1;
    for (const [c, t] of totals) {
      if (t.count > best) {
        best = t.count;
        currency = c;
      }
    }
  }
  return { amount: totals.get(currency)?.amount ?? 0, currency, mixed: totals.size > 1 };
}
