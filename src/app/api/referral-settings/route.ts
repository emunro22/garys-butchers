import { NextResponse } from 'next/server';
import { getShopSettings } from '@/lib/settings';

export async function GET() {
  const { referrals } = await getShopSettings();
  return NextResponse.json({ referrals });
}
