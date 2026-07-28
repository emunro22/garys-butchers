import {
  getOverviewStats,
  getSignupTrend,
  getOrderTrend,
  getHottestItemsByCategory,
  getEngagementStats,
  getLocationStats,
} from '@/lib/analytics';
import { formatPrice } from '@/lib/utils';
import { StatCard } from '@/components/admin/stat-card';
import { BarList, TrendChart } from '@/components/admin/analytics-charts';
import {
  Users,
  ClipboardList,
  Banknote,
  Receipt,
  Repeat,
  MousePointerClick,
  Eye,
  UserCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadAnalytics() {
  try {
    const [overview, signupTrend, orderTrend, hottest, engagement, locations] = await Promise.all([
      getOverviewStats(),
      getSignupTrend(30),
      getOrderTrend(30),
      getHottestItemsByCategory(),
      getEngagementStats(),
      getLocationStats(),
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

export default async function AdminAnalyticsPage() {
  const data = await loadAnalytics();

  if (data.error) {
    return (
      <div className="space-y-8">
        <header>
          <p className="eyebrow text-ink-500 mb-2">Insights</p>
          <h1 className="font-display text-4xl text-ink-900">Analytics</h1>
        </header>
        <div className="bg-cream-100 border border-ink-900/10 p-6 text-sm text-ink-700">
          Analytics couldn&apos;t load — if this is the first time you&apos;re seeing this page,
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
      <header>
        <p className="eyebrow text-ink-500 mb-2">Insights</p>
        <h1 className="font-display text-4xl text-ink-900">Analytics</h1>
        <p className="text-ink-500 text-sm mt-2 max-w-prose">
          How the shop is doing — sign-ups, orders, what&apos;s selling, and how people are using
          the website.
        </p>
      </header>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Customers"
          value={String(overview.totalCustomers)}
          sublabel={`+${overview.newCustomersLast30Days} in last 30 days`}
          icon={<Users className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Orders placed"
          value={String(overview.totalOrders)}
          sublabel={`+${overview.ordersLast30Days} in last 30 days`}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(overview.totalRevenueInPence)}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Avg order value"
          value={formatPrice(overview.avgOrderValueInPence)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Repeat buyer rate"
          value={`${overview.repeatBuyerRate}%`}
          sublabel={`${overview.repeatBuyers} of ${overview.buyers} buyers`}
          icon={<Repeat className="h-5 w-5" />}
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
        <StatCard
          label="Clicks"
          value={String(overview.totalClicks)}
          icon={<MousePointerClick className="h-5 w-5" />}
        />
      </div>

      {/* Sign-ups & orders trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Sign-ups (30 days)">
          <TrendChart data={signupTrend} />
        </Section>
        <Section title="Orders (30 days)">
          <TrendChart data={orderTrend} />
        </Section>
      </div>

      {/* Hottest items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Hottest item per category">
          <BarList
            items={hottest.hottestByCategory.map((h) => ({
              label: `${h.categoryName} — ${h.productName}`,
              value: h.quantity,
            }))}
            valueFormatter={(v) => `${v} sold`}
            emptyLabel="No sales yet"
          />
        </Section>
        <Section title="Overall bestsellers">
          <BarList
            items={hottest.bestsellers.map((b) => ({ label: b.productName, value: b.quantity }))}
            valueFormatter={(v) => `${v} sold`}
            emptyLabel="No sales yet"
          />
        </Section>
      </div>

      {/* Website engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Most viewed pages">
          <BarList
            items={engagement.topPages.map((p) => ({ label: p.path, value: p.count }))}
            valueFormatter={(v) => `${v} views`}
            emptyLabel="No page views tracked yet"
          />
        </Section>
        <Section title="Most clicked">
          <BarList
            items={engagement.topClicks.map((c) => ({ label: c.label, value: c.count }))}
            valueFormatter={(v) => `${v} clicks`}
            emptyLabel="No clicks tracked yet"
          />
        </Section>
      </div>

      {/* Geography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Where people shop most (delivery)">
          <BarList
            items={locations.mostPopular.map((c) => ({ label: c.city, value: c.orderCount }))}
            valueFormatter={(v) => `${v} orders`}
            emptyLabel="No delivery orders yet"
          />
        </Section>
        <Section title="Where people shop least (delivery)">
          <BarList
            items={locations.leastPopular.map((c) => ({ label: c.city, value: c.orderCount }))}
            valueFormatter={(v) => `${v} orders`}
            emptyLabel="No delivery orders yet"
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
        />
      </Section>
    </div>
  );
}
