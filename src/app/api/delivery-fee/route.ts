import { NextRequest, NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getDistanceMiles, calculateDeliveryByDistance } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postcode = searchParams.get('postcode') ?? '';

  if (!postcode) {
    return NextResponse.json({ error: 'postcode required' }, { status: 400 });
  }

  const { delivery } = await getShopSettings();
  const settings = {
    freeUnderMiles: delivery.freeUnderMiles,
    midTierMiles: delivery.midTierMiles,
    midTierFeePence: delivery.midTierFeePence,
    farFeePence: delivery.farFeePence,
    radiusMiles: delivery.radiusMiles,
  };

  const distanceMiles = await getDistanceMiles(postcode);
  const result = calculateDeliveryByDistance(distanceMiles, settings);

  return NextResponse.json({
    feePence: result.feePence,
    withinRadius: result.withinRadius,
    distanceMiles: distanceMiles !== null ? Math.round(distanceMiles * 10) / 10 : null,
  });
}
