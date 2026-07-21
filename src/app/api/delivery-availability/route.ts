import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getDeliveryBucketCounts } from '@/lib/delivery-availability';
import { bucketKey, generateDeliverySlots } from '@/lib/delivery-slots';

export async function GET() {
  const { deliverySlots } = await getShopSettings();
  const counts = await getDeliveryBucketCounts();

  // Seed every upcoming (date, block) bucket with its capacity so a block
  // with zero orders but zero capacity still shows as fully booked.
  const availability: Record<string, { count: number; capacity: number }> = {};
  for (const slot of generateDeliverySlots(7)) {
    const key = bucketKey(slot.dateKey, slot.blockKey);
    availability[key] = { count: counts[key] ?? 0, capacity: deliverySlots.capacity[slot.blockKey] };
  }

  return NextResponse.json({ availability });
}
