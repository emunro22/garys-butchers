import { ordersDb } from '@/lib/db';
import { referrals, users } from '@/lib/db/schema';
import { ensureReferralsSchema, ensureUsersSchema } from '@/lib/db/ensure-schema';
import { desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Gift } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminReferralsPage() {
  await ensureUsersSchema();
  await ensureReferralsSchema();

  const referrer = alias(users, 'referrer');
  const referred = alias(users, 'referred');

  const rows = await ordersDb
    .select({
      id: referrals.id,
      status: referrals.status,
      createdAt: referrals.createdAt,
      rewardedAt: referrals.rewardedAt,
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referredName: referred.name,
      referredEmail: referred.email,
    })
    .from(referrals)
    .innerJoin(referrer, eq(referrer.id, referrals.referrerUserId))
    .innerJoin(referred, eq(referred.id, referrals.referredUserId))
    .orderBy(desc(referrals.createdAt));

  function formatDate(d: Date | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Marketing</p>
        <h1 className="font-display text-4xl text-ink-900">Referrals</h1>
        <p className="text-sm text-ink-500 mt-2">
          Every referral relationship created via a customer&apos;s referral link. A referral
          becomes &quot;Rewarded&quot; the moment the referred customer completes their first paid
          order — that's when the referrer's discount is credited. Reward percentage and the
          on/off switch are in Settings.
        </p>
      </header>

      <div className="bg-cream-100 border border-ink-900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-ink-900/10">
            <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
              <th className="px-5 py-3">Referrer</th>
              <th className="px-5 py-3">Referred</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Rewarded</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                  <Gift className="h-8 w-8 mx-auto mb-3 text-ink-300" />
                  No referrals yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cream-50">
                <td className="px-5 py-3">
                  <p className="text-ink-900 font-medium">{r.referrerName}</p>
                  <p className="text-xs text-ink-500">{r.referrerEmail}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-ink-900 font-medium">{r.referredName}</p>
                  <p className="text-xs text-ink-500">{r.referredEmail}</p>
                </td>
                <td className="px-5 py-3 text-ink-700">{formatDate(r.createdAt)}</td>
                <td className="px-5 py-3 text-ink-700">{formatDate(r.rewardedAt)}</td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${
                      r.status === 'rewarded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
