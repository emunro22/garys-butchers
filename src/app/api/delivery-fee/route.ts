import { NextRequest, NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';
import { getDistanceMiles, calculateDeliveryByDistance } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postcode = searchParams.get('postcode') ?? '';
  const subtotal = parseInt(searchParams.get('subtotal') ?? '0', 10);

  if (!postcode) {
    return NextResponse.json({ error: 'postcode required' }, { status: 400 });
  }

  const { delivery } = await getShopSettings();
  const settings = {
    freeThresholdPence: delivery.freeThresholdPence,
    feePence: delivery.feePence,
    radiusMiles: delivery.radiusMiles,
    premiumFeePence: delivery.premiumFeePence ?? 500,
  };

  const distanceMiles = await getDistanceMiles(postcode);
  const feePence = calculateDeliveryByDistance(subtotal, distanceMiles, settings);

  return NextResponse.json({
    feePence,
    distanceMiles: distanceMiles !== null ? Math.round(distanceMiles * 10) / 10 : null,
  });
}
