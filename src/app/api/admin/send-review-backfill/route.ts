import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getReviewBackfillCandidates, runReviewBackfill } from '@/lib/review-backfill';

// One-time admin-triggered backfill — see src/lib/review-backfill.ts for the
// eligibility rules. GET previews the count without sending anything; POST
// actually sends. Safe to re-run: already-sent orders are excluded.

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dueOrEarlier, byEmail } = await getReviewBackfillCandidates();
  const sample = Array.from(byEmail.values())
    .slice(0, 10)
    .map((o) => ({ orderNumber: o.orderNumber, customerName: o.customerName, customerEmail: o.customerEmail }));

  return NextResponse.json({ eligibleOrders: dueOrEarlier.length, eligibleCustomers: byEmail.size, sample });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await runReviewBackfill();
  return NextResponse.json(result);
}
