import Link from 'next/link';
import {
  getOverviewStats,
  getSignupTrend,
  getOrderTrend,
  getHottestItemsByCategory,
  getEngagementStats,
  getLocationStats,
  resolveRange,
  TIME_RANGES,
} from '@/lib/analytics';
import { formatPrice } from '@/lib/utils';
import { StatCard } from '@/components/admin/stat-card';
import { BarList, TrendChart, dateLabel, timeLabel } from '@/components/admin/analytics-charts';
import { Users, ClipboardList, Banknote, Receipt, Eye, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadAnalytics(range: ReturnType<typeof resolveRange>) {
  try {
    const [overview, signupTrend, orderTrend, hottest, engagement, locations] = await Promise.all([
      getOverviewStats(range),
      getSignupTrend(range),
      getOrderTrend(range),
      getHottestItemsByCategory(range),
      getEngagementStats(range),
      getLocationStats(range),
    ]);
    return { overview, signupTrend, orderTrend, hottest, engagement, locations, error: false };
  } catch (err) {
    console.error('analytics load error', err);
    return { error: true as const };
  }
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-cream-100 border border-ink-900/10">
      <header className="p-5 md:p-6 border-b border-ink-900/10 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">{title}</h2>
        {action}
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function RangePicker({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TIME_RANGES.map((r) => (
        <Link
          key={r.key}
          href={`/admin/analytics?range=${r.key}`}
          className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] border transition-colors ${
            current === r.key
              ? 'bg-ink-900 text-cream-50 border-ink-900'
              : 'bg-cream-100 text-ink-700 border-ink-900/15 hover:border-ink-900/40'
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeKey } = await searchParams;
  const range = resolveRange(rangeKey);
  const data = await loadAnalytics(range);
  // Sub-day ranges bucket by minutes/hours, so label points with a time — anything
  // a day or longer buckets by day, so a date reads better than a repeated "12:00 AM".
  const labelFormatter = range.bucketMinutes < 60 * 24 ? timeLabel : dateLabel;

  if (data.error) {
    return (
      <div className="space-y-8">
        <header>
          <p className="eyebrow text-ink-500 mb-2">Insights</p>
          <h1 className="font-display text-4xl text-ink-900">Analytics</h1>
        </header>
        <div className="bg-cream-100 border border-ink-900/10 p-6 text-sm text-ink-700">
          Analytics couldn&apos;t load. If this is the first time you&apos;re seeing this page,
          the tracking table probably hasn&apos;t been created yet. Run{' '}
          <code className="bg-ink-900/5 px-1.5 py-0.5">POST /api/admin/migrate-analytics</code>{' '}
          once, then refresh.
        </div>
      </div>
    );
  }

  const { overview, signupTrend, orderTrend, hottest, engagement, locations } = data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Insights</p>
          <h1 className="font-display text-4xl text-ink-900">Analytics</h1>
          <p className="text-ink-500 text-sm mt-2 max-w-prose">
            Everything below is scoped to the last{' '}
            <span className="text-ink-700 font-medium">{range.label}</span>:{' '}
            {overview.totalCustomersEver} customers have signed up in total.
          </p>
        </div>
        <RangePicker current={range.key} />
      </header>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sign-ups"
          value={String(overview.newCustomers)}
          sublabel={`of ${overview.totalCustomersEver} all-time`}
          icon={<Users className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Orders placed"
          value={String(overview.totalOrders)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue"
          value={formatPrice(overview.totalRevenueInPence)}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Avg order value"
          value={formatPrice(overview.avgOrderValueInPence)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Unique visitors"
          value={String(overview.uniqueVisitors)}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Page views"
          value={String(overview.totalPageviews)}
          icon={<Eye className="h-5 w-5" />}
        />
      </div>

      {/* Sign-ups & orders trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={`Sign-ups (${range.label})`}>
          <TrendChart data={signupTrend} labelFormatter={labelFormatter} />
        </Section>
        <Section title={`Orders (${range.label})`}>
          <TrendChart data={orderTrend} labelFormatter={labelFormatter} />
        </Section>
      </div>

      {/* Hottest items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Hottest item per category">
          <BarList
            items={hottest.hottestByCategory.map((h) => ({
              label: `${h.categoryName}: ${h.productName}`,
              value: h.quantity,
            }))}
            valueFormatter={(v) => `${v} sold`}
            emptyLabel="No sales in this period"
          />
        </Section>
        <Section title="Overall bestsellers">
          <BarList
            items={hottest.bestsellers.map((b) => ({ label: b.productName, value: b.quantity }))}
            valueFormatter={(v) => `${v} sold`}
            emptyLabel="No sales in this period"
          />
        </Section>
      </div>

      {/* Website engagement */}
      <Section title="Most viewed pages">
        <BarList
          items={engagement.topPages.map((p) => ({ label: p.path, value: p.count }))}
          valueFormatter={(v) => `${v} views`}
          emptyLabel="No page views in this period"
        />
      </Section>

      {/* Geography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Where people shop most (delivery)">
          <BarList
            items={locations.mostPopular.map((c) => ({ label: c.city, value: c.orderCount }))}
            valueFormatter={(v) => `${v} orders`}
            emptyLabel="No delivery orders in this period"
          />
        </Section>
        <Section title="Where people shop least (delivery)">
          <BarList
            items={locations.leastPopular.map((c) => ({ label: c.city, value: c.orderCount }))}
            valueFormatter={(v) => `${v} orders`}
            emptyLabel="No delivery orders in this period"
          />
        </Section>
      </div>

      <Section title="Pickup vs delivery">
        <BarList
          items={locations.fulfilmentSplit.map((f) => ({
            label: f.fulfilment === 'pickup' ? 'Pickup' : 'Delivery',
            value: f.count,
          }))}
          valueFormatter={(v) => `${v} orders`}
          emptyLabel="No orders in this period"
        />
      </Section>
    </div>
  );
}
