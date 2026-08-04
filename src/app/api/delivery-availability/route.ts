import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getDeliveryBucketCounts } from '@/lib/delivery-availability';
import { bucketKey, generateSlots, isPastCutoff } from '@/lib/slots';

export async function GET() {
  const { deliverySlots, banner } = await getShopSettings();
  const counts = await getDeliveryBucketCounts();

  // Once today's next-day delivery cutoff (admin-configured) has passed,
  // "tomorrow" is no longer bookable — the earliest slot slides out by a day.
  const minNoticeDays = isPastCutoff(banner.cutoffHour) ? 1 : 0;

  // Seed every upcoming (date, block) bucket with its capacity so a block
  // with zero orders but zero capacity still shows as fully booked.
  const availability: Record<string, { count: number; capacity: number }> = {};
  const capacityByBlock = Object.fromEntries(deliverySlots.blocks.map((b) => [b.id, b.capacity]));
  for (const slot of generateSlots(deliverySlots, 7, minNoticeDays)) {
    const key = bucketKey(slot.dateKey, slot.blockId);
    availability[key] = { count: counts[key] ?? 0, capacity: capacityByBlock[slot.blockId] ?? 0 };
  }

  return NextResponse.json({ availability, group: deliverySlots, minNoticeDays });
}
