import { NextRequest, NextResponse } from 'next/server';
import { lt } from 'drizzle-orm';
import { catalogDb } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';

// The admin analytics dashboard only ever shows the last 7 days (see
// TIME_RANGES in src/lib/analytics.ts), so nothing older than that needs to
// stay in the catalog DB — keeps the table (and compute spent scanning it) small.
const RETENTION_DAYS = 7;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await catalogDb.delete(analyticsEvents).where(lt(analyticsEvents.createdAt, cutoff)).returning({ id: analyticsEvents.id });

  return NextResponse.json({ deleted: deleted.length });
}
