import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { referrals, users } from '@/lib/db/schema';
import { ensureUsersSchema, ensureReferralsSchema } from '@/lib/db/ensure-schema';
import { eq, desc } from 'drizzle-orm';
import { getOrCreateReferralCode } from '@/lib/referrals';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await ensureUsersSchema();
  await ensureReferralsSchema();

  const [code, [me], history] = await Promise.all([
    getOrCreateReferralCode(session.userId),
    db
      .select({ referralCreditsAvailable: users.referralCreditsAvailable })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1),
    db
      .select({
        id: referrals.id,
        status: referrals.status,
        createdAt: referrals.createdAt,
        rewardedAt: referrals.rewardedAt,
        referredName: users.name,
      })
      .from(referrals)
      .innerJoin(users, eq(users.id, referrals.referredUserId))
      .where(eq(referrals.referrerUserId, session.userId))
      .orderBy(desc(referrals.createdAt)),
  ]);

  return NextResponse.json({
    referralCode: code,
    creditsAvailable: me?.referralCreditsAvailable ?? 0,
    history: history.map((h) => ({
      ...h,
      // First name only — this is shown back to the referrer, not an admin.
      referredName: h.referredName.split(' ')[0],
      createdAt: h.createdAt.toISOString(),
      rewardedAt: h.rewardedAt ? h.rewardedAt.toISOString() : null,
    })),
  });
}
