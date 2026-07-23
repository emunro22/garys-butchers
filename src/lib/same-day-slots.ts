// Same-day delivery — today only, tighter 2-hour blocks. Kept separate from
// the regular (tomorrow-onward) delivery blocks in delivery-slots.ts since
// the windows, capacity, and eligibility rules are all distinct.

import { getDeliveryDateKey } from './delivery-slots';

export const SAME_DAY_BLOCKS = [
  { key: 'nineEleven', startHour: 9, endHour: 11, label: '9 – 11am' },
  { key: 'elevenOne', startHour: 11, endHour: 13, label: '11am – 1pm' },
  { key: 'oneThree', startHour: 13, endHour: 15, label: '1 – 3pm' },
] as const;

export type SameDayBlockKey = (typeof SAME_DAY_BLOCKS)[number]['key'];

export type SameDaySlot = {
  value: string; // ISO datetime at the block's start hour, today
  label: string;
  blockKey: SameDayBlockKey;
  dateKey: string;
};

export function getSameDayBlockKey(date: Date): SameDayBlockKey | null {
  const hour = date.getHours();
  const block = SAME_DAY_BLOCKS.find((b) => hour >= b.startHour && hour < b.endHour);
  return block?.key ?? null;
}

/** True if `date` falls on the same calendar day as `now`. */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return getDeliveryDateKey(date) === getDeliveryDateKey(now);
}

/**
 * Today's still-bookable same-day slots. A block stops being offered once it
 * ends (not once it starts) — e.g. 9-11 is still bookable at 10:45.
 * Returns [] on Sundays (closed) or once all of today's blocks have ended.
 */
export function generateSameDaySlots(now: Date = new Date()): SameDaySlot[] {
  if (now.getDay() === 0) return []; // closed Sunday
  const dateKey = getDeliveryDateKey(now);
  const out: SameDaySlot[] = [];
  for (const block of SAME_DAY_BLOCKS) {
    if (now.getHours() >= block.endHour) continue; // block already over for today
    const iso = new Date(now);
    iso.setHours(block.startHour, 0, 0, 0);
    out.push({
      value: iso.toISOString(),
      label: `Today · ${block.label}`,
      blockKey: block.key,
      dateKey,
    });
  }
  return out;
}
