import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { SubscribersView } from '@/components/admin/subscribers-view';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const all = await db
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt));

  const active = all.filter((s) => s.isActive);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Marketing</p>
        <h1 className="font-display text-4xl text-ink-900">Mailing list</h1>
        <p className="text-sm text-ink-500 mt-2">
          {active.length} active subscriber{active.length === 1 ? '' : 's'} · {all.length} total
        </p>
      </header>

      <SubscribersView
        subscribers={all.map((s) => ({
          ...s,
          subscribedAt: s.subscribedAt.toISOString(),
          unsubscribedAt: s.unsubscribedAt ? s.unsubscribedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}