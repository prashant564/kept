export type CategoryId =
  | 'electronics'
  | 'appliances'
  | 'kitchen'
  | 'furniture'
  | 'clothing'
  | 'tools'
  | 'sports'
  | 'vehicle'
  | 'jewelry'
  | 'other';

export type AttachmentKind = 'image' | 'pdf';

export interface Attachment {
  id: string;
  itemId: string;
  uri: string;
  kind: AttachmentKind;
  name: string;
  createdAt: string;
}

/** Warranty length in months. 0 = no warranty, -1 = lifetime. */
export type WarrantyMonths = number;

export interface Item {
  id: string;
  name: string;
  store: string;
  category: CategoryId;
  price: number | null;
  currency: string;
  /** ISO date (yyyy-mm-dd). */
  purchaseDate: string;
  warrantyMonths: WarrantyMonths;
  /** Return window in days. 0 = none. */
  returnDays: number;
  serial: string;
  notes: string;
  /** Scheduled notification identifiers, so they can be cancelled. */
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export type ItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'notificationIds' | 'attachments'> & {
  attachments: Pick<Attachment, 'uri' | 'kind' | 'name'>[];
};

export interface Settings {
  onboarded: boolean;
  isPro: boolean;
  remindersEnabled: boolean;
  currency: string;
}
