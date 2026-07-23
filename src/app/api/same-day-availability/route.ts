import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getSameDayBucketCounts } from '@/lib/same-day-availability';

export async function GET() {
  const { sameDay } = await getShopSettings();
  const counts = await getSameDayBucketCounts();

  const availability: Record<string, { count: number; capacity: number }> = {};
  for (const block of sameDay.blocks) {
    availability[block.id] = {
      count: counts[block.id] ?? 0,
      capacity: block.capacity,
    };
  }

  return NextResponse.json({ availability, group: sameDay });
}
