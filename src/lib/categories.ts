import type { CategoryId, Item } from './types';

export type SoftTone = 'pink' | 'yellow' | 'green' | 'primary' | 'orange' | 'grey';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  tone: SoftTone;
}

export const CATEGORIES: Category[] = [
  { id: 'electronics', label: 'Electronics', emoji: '📱', tone: 'primary' },
  { id: 'appliances', label: 'Appliances', emoji: '🧺', tone: 'green' },
  { id: 'kitchen', label: 'Kitchen', emoji: '☕', tone: 'orange' },
  { id: 'furniture', label: 'Furniture', emoji: '🛋️', tone: 'yellow' },
  { id: 'clothing', label: 'Clothing', emoji: '🧥', tone: 'pink' },
  { id: 'tools', label: 'Tools', emoji: '🔧', tone: 'grey' },
  { id: 'sports', label: 'Sports', emoji: '⚽', tone: 'green' },
  { id: 'vehicle', label: 'Vehicle', emoji: '🚗', tone: 'primary' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💍', tone: 'yellow' },
  { id: 'other', label: 'Other', emoji: '📦', tone: 'grey' },
];

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Keyword → emoji, so items get a recognisable object instead of a generic category icon. */
const KEYWORDS: [RegExp, string][] = [
  [/headphone|earbud|airpod|wh-?1000|buds|headset/i, '🎧'],
  [/macbook|laptop|notebook|thinkpad|xps/i, '💻'],
  [/iphone|phone|pixel|galaxy/i, '📱'],
  [/ipad|tablet/i, '📲'],
  [/kindle|e-?reader|book/i, '📖'],
  [/watch/i, '⌚'],
  [/camera|gopro|lens/i, '📷'],
  [/tv|television|monitor|display/i, '📺'],
  [/console|playstation|ps5|xbox|switch/i, '🎮'],
  [/speaker|sonos|soundbar/i, '🔊'],
  [/drill|saw|driver|dewalt|makita/i, '🛠️'],
  [/vacuum|dyson|roomba/i, '🧹'],
  [/dishwasher/i, '🍽️'],
  [/washer|washing|dryer/i, '🧺'],
  [/fridge|refrigerator|freezer/i, '🧊'],
  [/coffee|espresso|barista|nespresso/i, '☕'],
  [/oven|dutch|pan|pot|cookware/i, '🍲'],
  [/blender|mixer|kitchenaid/i, '🥤'],
  [/chair|aeron/i, '🪑'],
  [/sofa|couch/i, '🛋️'],
  [/bed|mattress/i, '🛏️'],
  [/lamp|light/i, '💡'],
  [/jacket|coat|parka/i, '🧥'],
  [/shoe|sneaker|boot/i, '👟'],
  [/bag|backpack|luggage|suitcase/i, '🎒'],
  [/bike|bicycle/i, '🚲'],
  [/ring|necklace|bracelet|earring/i, '💍'],
  [/car|tire|tyre/i, '🚗'],
];

export function itemEmoji(item: Pick<Item, 'name' | 'category'>): string {
  for (const [re, emoji] of KEYWORDS) if (re.test(item.name)) return emoji;
  return getCategory(item.category).emoji;
}
