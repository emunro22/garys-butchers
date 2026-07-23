import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getPickupBucketCounts } from '@/lib/pickup-availability';
import { bucketKey, generateSlots } from '@/lib/slots';

export async function GET() {
  const { pickupSlots } = await getShopSettings();
  const counts = await getPickupBucketCounts();

  const availability: Record<string, { count: number; capacity: number }> = {};
  const capacityByBlock = Object.fromEntries(pickupSlots.blocks.map((b) => [b.id, b.capacity]));
  for (const slot of generateSlots(pickupSlots, 7)) {
    const key = bucketKey(slot.dateKey, slot.blockId);
    availability[key] = { count: counts[key] ?? 0, capacity: capacityByBlock[slot.blockId] ?? 0 };
  }

  return NextResponse.json({ availability, group: pickupSlots });
}
