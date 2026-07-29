import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';

export async function GET() {
  const { premiumDelivery } = await getShopSettings();
  return NextResponse.json({ premiumDelivery });
}
