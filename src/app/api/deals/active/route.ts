import { NextResponse } from 'next/server';
import { catalogDb } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { and, eq, or, isNull, gte, asc } from 'drizzle-orm';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';

// Public — feeds the automatic bundle-deal discount in checkout (see
// src/lib/deals-pricing.ts). Only returns what's already visible in the
// public deal cards (SeasonalDeals), nothing admin-only.
export async function GET() {
  try {
    await ensureProductsSchema();
    const now = new Date();
    const active = await catalogDb
      .select({ id: deals.id, title: deals.title, dealItems: deals.dealItems, dealPrice: deals.dealPrice })
      .from(deals)
      .where(and(eq(deals.status, 'published'), or(isNull(deals.endsAt), gte(deals.endsAt, now))))
      .orderBy(asc(deals.createdAt));
    return NextResponse.json({ deals: active });
  } catch (err) {
    console.error('deals/active GET error', err);
    return NextResponse.json({ deals: [] });
  }
}
