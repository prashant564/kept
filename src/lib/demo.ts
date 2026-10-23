import { addDays, addMonths, startOfToday, toISODate } from './dates';
import type { ItemInput } from './types';

/** Sample items spread across every coverage state, for first-run exploration. */
export function demoItems(currency: string): ItemInput[] {
  const today = startOfToday();
  const ago = (months: number, days = 0) => toISODate(addDays(addMonths(today, -months), -days));
  const base = { currency, serial: '', notes: '', attachments: [] };

  return [
    { ...base, name: 'Sony WH-1000XM6', store: 'Best Buy', category: 'electronics', price: 399, purchaseDate: ago(0, 9), warrantyMonths: 12, returnDays: 14, serial: 'S01-4471-2290' },
    { ...base, name: 'MacBook Air 15"', store: 'Apple Store', category: 'electronics', price: 1299, purchaseDate: ago(10, 20), warrantyMonths: 12, returnDays: 14, notes: 'AppleCare+ not purchased.' },
    { ...base, name: 'Bosch Series 6 Dishwasher', store: 'Home Depot', category: 'appliances', price: 849, purchaseDate: ago(14), warrantyMonths: 24, returnDays: 30 },
    { ...base, name: 'Dyson V15 Detect', store: 'Dyson', category: 'appliances', price: 749, purchaseDate: ago(5), warrantyMonths: 24, returnDays: 0 },
    { ...base, name: 'Breville Barista Express', store: 'Williams Sonoma', category: 'kitchen', price: 699, purchaseDate: ago(22, 18), warrantyMonths: 24, returnDays: 30 },
    { ...base, name: 'Herman Miller Aeron', store: 'Design Within Reach', category: 'furniture', price: 1395, purchaseDate: ago(30), warrantyMonths: 144, returnDays: 30 },
    { ...base, name: 'Le Creuset Dutch Oven', store: 'Le Creuset', category: 'kitchen', price: 420, purchaseDate: ago(18), warrantyMonths: -1, returnDays: 0 },
    { ...base, name: 'Patagonia Down Jacket', store: 'Patagonia', category: 'clothing', price: 279, purchaseDate: ago(8), warrantyMonths: -1, returnDays: 0 },
    { ...base, name: 'DeWalt 20V Drill Kit', store: 'Lowe’s', category: 'tools', price: 179, purchaseDate: ago(40), warrantyMonths: 36, returnDays: 90 },
  ];
}
