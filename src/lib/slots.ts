// Shared time-block model used by delivery, same-day delivery, and pickup —
// all three are admin-configurable lists of blocks (start/end time + capacity)
// plus a set of closed weekdays. Centralised here so the block math (labels,
// bucket keys, which block a timestamp falls into, slot generation) only
// ever lives in one place.
//
// All "what day/hour is it" logic below is pinned to the shop's own timezone
// (Europe/London) rather than the runtime's local clock. The storefront runs
// in a browser in the UK, but API routes run on servers set to UTC — without
// this, "9am" as booked by a customer and "9am" as re-checked by the server
// disagree by an hour whenever the UK is on BST.

const SHOP_TZ = 'Europe/London';

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

/** The precise UTC instant for a given wall-clock time in the shop's
 *  timezone — correctly handles the BST/GMT offset for that date. */
export function londonDateTime(year: number, month: number, day: number, minutesSinceMidnight = 0): Date {
  const hour = Math.floor(minutesSinceMidnight / 60);
  const minute = minutesSinceMidnight % 60;
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const seen = londonParts(guess);
  const wantedAsUTC = Date.UTC(year, month - 1, day, hour, minute);
  const seenAsUTC = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute);
  return new Date(guess.getTime() + (wantedAsUTC - seenAsUTC));
}

export type SlotBlock = {
  id: string;
  startMinutes: number; // minutes since midnight, e.g. 9am = 540
  endMinutes: number; // minutes since midnight; equal to startMinutes for an instant slot
  capacity: number;
};

export type SlotGroupSettings = {
  blocks: SlotBlock[];
  closedDays: number[]; // 0 = Sunday ... 6 = Saturday
  // Optional early-closing cutoff applied only on Saturdays — blocks starting
  // at or after this time aren't offered/valid that day. null/undefined means
  // Saturdays use the same blocks as every other open day.
  saturdayCutoffMinutes?: number | null;
  // Optional floor on same-day booking (used by generateTodaySlots) — before
  // this time today, no "today" slots are offered at all, e.g. so same-day
  // delivery can't be ordered overnight before the shop opens.
  opensAtMinutes?: number;
};

export type GeneratedSlot = {
  value: string; // ISO datetime at the block's start time
  label: string;
  blockId: string;
  dateKey: string;
};

export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function blockLabel(block: SlotBlock): string {
  if (block.endMinutes > block.startMinutes) {
    return `${formatClock(block.startMinutes)} – ${formatClock(block.endMinutes)}`;
  }
  return formatClock(block.startMinutes);
}

/** 'yyyy-mm-dd' as seen in the shop's timezone. */
export function getDateKey(date: Date): string {
  const { year, month, day } = londonParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 0 (Sunday) – 6 (Saturday), as seen in the shop's timezone. */
export function getWeekday(date: Date): number {
  const { year, month, day } = londonParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** True if `date` falls on the same calendar day as `now`, in the shop's timezone. */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return getDateKey(date) === getDateKey(now);
}

/** Minutes since local midnight, as seen in the shop's timezone. */
export function minutesOfDay(date: Date): number {
  const { hour, minute } = londonParts(date);
  return hour * 60 + minute;
}

/** Whether the shop's own clock has passed cutoffHour today (Europe/London). */
export function isPastCutoff(cutoffHour: number, now: Date = new Date()): boolean {
  return minutesOfDay(now) >= cutoffHour * 60;
}

/** Which block (if any) a timestamp falls into — start inclusive, end exclusive, or an exact match for an instant block. */
export function findBlock(blocks: SlotBlock[], date: Date): SlotBlock | null {
  const m = minutesOfDay(date);
  return (
    blocks.find((b) =>
      b.endMinutes > b.startMinutes ? m >= b.startMinutes && m < b.endMinutes : m === b.startMinutes
    ) ?? null
  );
}

export function bucketKey(dateKey: string, blockId: string) {
  return `${dateKey}:${blockId}`;
}

function sortedBlocks(blocks: SlotBlock[]) {
  return [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);
}

/** Blocks actually offered on a given weekday — trims anything starting at or
 *  after the group's Saturday cutoff (if set) when that weekday is Saturday. */
export function blocksForWeekday(group: SlotGroupSettings, weekday: number): SlotBlock[] {
  const blocks = sortedBlocks(group.blocks);
  if (weekday === 6 && typeof group.saturdayCutoffMinutes === 'number') {
    return blocks.filter((b) => b.startMinutes < group.saturdayCutoffMinutes!);
  }
  return blocks;
}

/**
 * Next `days` eligible days (skipping closedDays), one slot per block.
 * `minNoticeDays` pushes the baseline (normally "tomorrow") out further —
 * e.g. delivery passes 1 here once today's next-day cutoff has passed, so
 * the earliest bookable day becomes the day after tomorrow.
 */
export function generateSlots(group: SlotGroupSettings, days: number, minNoticeDays = 0): GeneratedSlot[] {
  const out: GeneratedSlot[] = [];
  let { year, month, day } = londonParts(new Date());
  day += minNoticeDays;
  let daysAdded = 0;
  while (daysAdded < days) {
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    year = next.getUTCFullYear();
    month = next.getUTCMonth() + 1;
    day = next.getUTCDate();

    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (group.closedDays.includes(weekday)) continue;
    daysAdded++;

    const dateStr = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    for (const block of blocksForWeekday(group, weekday)) {
      const iso = londonDateTime(year, month, day, block.startMinutes);
      out.push({
        value: iso.toISOString(),
        label: `${dateStr} · ${blockLabel(block)}`,
        blockId: block.id,
        dateKey,
      });
    }
  }
  return out;
}

/**
 * Today's still-bookable slots (for same-day style booking). A block stops
 * being offered once it ends (not once it starts). Returns [] if today is a
 * closed day or every block has already ended.
 */
export function generateTodaySlots(group: SlotGroupSettings, now: Date = new Date()): GeneratedSlot[] {
  const weekday = getWeekday(now);
  if (group.closedDays.includes(weekday)) return [];
  const { year, month, day } = londonParts(now);
  const dateKey = getDateKey(now);
  const nowMinutes = minutesOfDay(now);
  if (typeof group.opensAtMinutes === 'number' && nowMinutes < group.opensAtMinutes) return [];
  const out: GeneratedSlot[] = [];
  for (const block of blocksForWeekday(group, weekday)) {
    const endsAt = block.endMinutes > block.startMinutes ? block.endMinutes : block.startMinutes;
    if (nowMinutes >= endsAt) continue;
    const iso = londonDateTime(year, month, day, block.startMinutes);
    out.push({
      value: iso.toISOString(),
      label: `Today · ${blockLabel(block)}`,
      blockId: block.id,
      dateKey,
    });
  }
  return out;
}
