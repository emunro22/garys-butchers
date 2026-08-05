import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';

export async function GET() {
  const { sameDayFee } = await getShopSettings();
  return NextResponse.json({ sameDayFee });
}
