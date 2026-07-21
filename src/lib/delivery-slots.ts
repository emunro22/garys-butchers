// Shared delivery-slot block definitions — used by the checkout UI, the
// availability endpoint, and checkout order validation so the block
// boundaries only ever live in one place.

export const DELIVERY_BLOCKS = [
  { key: 'morning', startHour: 9, endHour: 12, label: '9am – 12pm' },
  { key: 'midday', startHour: 12, endHour: 15, label: '12 – 3pm' },
  { key: 'afternoon', startHour: 15, endHour: 18, label: '3 – 6pm' },
] as const;

export type DeliveryBlockKey = (typeof DELIVERY_BLOCKS)[number]['key'];

export type DeliverySlot = {
  value: string; // ISO datetime at the block's start hour
  label: string;
  blockKey: DeliveryBlockKey;
  dateKey: string;
};

/** 'yyyy-mm-dd' in local time — avoids UTC-shift issues from toISOString(). */
export function getDeliveryDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDeliveryBlockKey(date: Date): DeliveryBlockKey | null {
  if (date.getDay() === 0) return null; // closed Sunday
  const hour = date.getHours();
  const block = DELIVERY_BLOCKS.find((b) => hour >= b.startHour && hour < b.endHour);
  return block?.key ?? null;
}

export function bucketKey(dateKey: string, blockKey: DeliveryBlockKey) {
  return `${dateKey}:${blockKey}`;
}

/** Next `days` delivery-eligible days (skips Sunday), 3 blocks each. */
export function generateDeliverySlots(days = 7): DeliverySlot[] {
  const out: DeliverySlot[] = [];
  const now = new Date();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  let daysAdded = 0;
  while (daysAdded < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue; // closed Sunday
    daysAdded++;
    const dateStr = d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    const dateKey = getDeliveryDateKey(d);
    for (const block of DELIVERY_BLOCKS) {
      const iso = new Date(d);
      iso.setHours(block.startHour, 0, 0, 0);
      out.push({
        value: iso.toISOString(),
        label: `${dateStr} · ${block.label}`,
        blockKey: block.key,
        dateKey,
      });
    }
  }
  return out;
}
