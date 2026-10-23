import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

import type { CategoryId } from './types';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface Category {
  id: CategoryId;
  label: string;
  icon: FeatherName;
  /** Soft tile colours for light and dark mode. */
  tint: { light: string; dark: string };
}

export const CATEGORIES: Category[] = [
  { id: 'electronics', label: 'Electronics', icon: 'smartphone', tint: { light: '#DDE6F7', dark: '#1E2A3D' } },
  { id: 'appliances', label: 'Appliances', icon: 'wind', tint: { light: '#E4F0E6', dark: '#1C2E22' } },
  { id: 'kitchen', label: 'Kitchen', icon: 'coffee', tint: { light: '#F6E6D6', dark: '#33261A' } },
  { id: 'furniture', label: 'Furniture', icon: 'home', tint: { light: '#ECE3F4', dark: '#2A2133' } },
  { id: 'clothing', label: 'Clothing', icon: 'shopping-bag', tint: { light: '#F6DFE3', dark: '#35202A' } },
  { id: 'tools', label: 'Tools', icon: 'tool', tint: { light: '#E9E7DD', dark: '#2A2923' } },
  { id: 'sports', label: 'Sports', icon: 'activity', tint: { light: '#DFF1F0', dark: '#1A2F2E' } },
  { id: 'vehicle', label: 'Vehicle', icon: 'truck', tint: { light: '#E6E9EF', dark: '#23262D' } },
  { id: 'jewelry', label: 'Jewelry', icon: 'star', tint: { light: '#F7EECF', dark: '#332C17' } },
  { id: 'other', label: 'Other', icon: 'tag', tint: { light: '#ECE8E1', dark: '#26251F' } },
];

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
