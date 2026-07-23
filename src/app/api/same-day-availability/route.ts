import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getSameDayBucketCounts } from '@/lib/same-day-availability';
import { SAME_DAY_BLOCKS } from '@/lib/same-day-slots';

export async function GET() {
  const { sameDay } = await getShopSettings();
  const counts = await getSameDayBucketCounts();

  const availability: Record<string, { count: number; capacity: number }> = {};
  for (const block of SAME_DAY_BLOCKS) {
    availability[block.key] = {
      count: counts[block.key] ?? 0,
      capacity: sameDay.capacity[block.key],
    };
  }

  return NextResponse.json({ availability });
}
