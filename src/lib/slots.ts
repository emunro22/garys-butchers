// Shared time-block model used by delivery, same-day delivery, and pickup —
// all three are admin-configurable lists of blocks (start/end time + capacity)
// plus a set of closed weekdays. Centralised here so the block math (labels,
// bucket keys, which block a timestamp falls into, slot generation) only
// ever lives in one place.

export type SlotBlock = {
  id: string;
  startMinutes: number; // minutes since midnight, e.g. 9am = 540
  endMinutes: number; // minutes since midnight; equal to startMinutes for an instant slot
  capacity: number;
};

export type SlotGroupSettings = {
  blocks: SlotBlock[];
  closedDays: number[]; // 0 = Sunday ... 6 = Saturday
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

/** 'yyyy-mm-dd' in local time — avoids UTC-shift issues from toISOString(). */
export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True if `date` falls on the same calendar day as `now`. */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return getDateKey(date) === getDateKey(now);
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
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

/** Next `days` eligible days (skipping closedDays), one slot per block. */
export function generateSlots(group: SlotGroupSettings, days: number): GeneratedSlot[] {
  const blocks = sortedBlocks(group.blocks);
  const out: GeneratedSlot[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  let daysAdded = 0;
  while (daysAdded < days) {
    d.setDate(d.getDate() + 1);
    if (group.closedDays.includes(d.getDay())) continue;
    daysAdded++;
    const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    const dateKey = getDateKey(d);
    for (const block of blocks) {
      const iso = new Date(d);
      iso.setHours(Math.floor(block.startMinutes / 60), block.startMinutes % 60, 0, 0);
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
  if (group.closedDays.includes(now.getDay())) return [];
  const dateKey = getDateKey(now);
  const nowMinutes = minutesOfDay(now);
  const out: GeneratedSlot[] = [];
  for (const block of sortedBlocks(group.blocks)) {
    const endsAt = block.endMinutes > block.startMinutes ? block.endMinutes : block.startMinutes;
    if (nowMinutes >= endsAt) continue;
    const iso = new Date(now);
    iso.setHours(Math.floor(block.startMinutes / 60), block.startMinutes % 60, 0, 0);
    out.push({
      value: iso.toISOString(),
      label: `Today · ${blockLabel(block)}`,
      blockId: block.id,
      dateKey,
    });
  }
  return out;
}
