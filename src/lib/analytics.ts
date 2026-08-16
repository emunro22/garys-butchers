import { catalogDb, ordersDb } from '@/lib/db';
import { users, orders } from '@/lib/db/schema-orders';
import { products, categories, analyticsEvents } from '@/lib/db/schema-catalog';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { activeOrderFilter } from '@/lib/order-status';

// ---------- Time ranges ----------
// A trailing window from "now", CloudWatch-style — the whole dashboard is
// scoped to whichever of these is selected, with the trend chart's bucket
// size adapting so it never renders more than ~30 points.

export const TIME_RANGES = [
  { key: '1h', label: '1 hour', hours: 1, bucketMinutes: 5 },
  { key: '3h', label: '3 hours', hours: 3, bucketMinutes: 15 },
  { key: '12h', label: '12 hours', hours: 12, bucketMinutes: 60 },
  { key: '1d', label: '1 day', hours: 24, bucketMinutes: 60 },
  { key: '1w', label: '1 week', hours: 24 * 7, bucketMinutes: 60 * 24 },
  { key: '1m', label: '1 month', hours: 24 * 30, bucketMinutes: 60 * 24 },
] as const;

export type RangeKey = (typeof TIME_RANGES)[number]['key'];

export interface ResolvedRange {
  key: RangeKey;
  label: string;
  since: Date;
  bucketMinutes: number;
}

const DEFAULT_RANGE: RangeKey = '1w';

export function resolveRange(key: string | undefined): ResolvedRange {
  const found = TIME_RANGES.find((r) => r.key === key) ?? TIME_RANGES.find((r) => r.key === DEFAULT_RANGE)!;
  return {
    key: found.key,
    label: found.label,
    since: new Date(Date.now() - found.hours * 60 * 60 * 1000),
    bucketMinutes: found.bucketMinutes,
  };
}

/** Builds a continuous bucketed series from `since` to now, filling gaps with 0
 *  so the chart never silently skips a bucket with no activity. */
function fillBucketedSeries(
  rows: Array<{ bucket: string; count: number }>,
  since: Date,
  bucketMinutes: number
): Array<{ date: string; count: number }> {
  const bucketMs = bucketMinutes * 60 * 1000;
  const byBucket = new Map(rows.map((r) => [new Date(r.bucket).getTime(), r.count]));
  const start = Math.floor(since.getTime() / bucketMs) * bucketMs;
  const end = Math.floor(Date.now() / bucketMs) * bucketMs;
  const series: Array<{ date: string; count: number }> = [];
  for (let t = start; t <= end; t += bucketMs) {
    series.push({ date: new Date(t).toISOString(), count: byBucket.get(t) ?? 0 });
  }
  return series;
}

/** Postgres expression that floors created_at down to the nearest bucketMinutes interval, as UTC ISO text. */
function bucketExpr(column: typeof users.createdAt | typeof orders.createdAt | typeof analyticsEvents.createdAt, bucketMinutes: number) {
  const bucketSeconds = bucketMinutes * 60;
  return sql<string>`to_char(to_timestamp(floor(extract(epoch from ${column}) / ${bucketSeconds}) * ${bucketSeconds}) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
}

export async function getOverviewStats(range: ResolvedRange) {
  const { since } = range;

  const [
    [totalCustomersEver],
    [newCustomers],
    [orderCount],
    [revenueRow],
    [pageviewCount],
    [clickCount],
    [visitorRow],
  ] = await Promise.all([
    ordersDb.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'customer')),
    ordersDb
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, 'customer'), gte(users.createdAt, since))),
    ordersDb
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(activeOrderFilter(), gte(orders.createdAt, since))),
    ordersDb
      .select({ total: sql<number>`coalesce(sum(${orders.totalInPence}), 0)::int` })
      .from(orders)
      .where(and(activeOrderFilter(), gte(orders.createdAt, since))),
    catalogDb
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.type, 'pageview'), gte(analyticsEvents.createdAt, since))),
    catalogDb
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.type, 'click'), gte(analyticsEvents.createdAt, since))),
    catalogDb
      .select({ count: sql<number>`count(distinct ${analyticsEvents.sessionId})::int` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since)),
  ]);

  const totalOrders = orderCount?.count ?? 0;
  const revenue = revenueRow?.total ?? 0;

  // Repeat customers = distinct customer emails with more than one real order in this window.
  const repeatRows = await ordersDb
    .select({ email: orders.customerEmail, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(activeOrderFilter(), gte(orders.createdAt, since)))
    .groupBy(orders.customerEmail);
  const buyers = repeatRows.length;
  const repeatBuyers = repeatRows.filter((r) => r.count > 1).length;

  return {
    totalCustomersEver: totalCustomersEver?.count ?? 0,
    newCustomers: newCustomers?.count ?? 0,
    totalOrders,
    totalRevenueInPence: revenue,
    avgOrderValueInPence: totalOrders > 0 ? Math.round(revenue / totalOrders) : 0,
    totalPageviews: pageviewCount?.count ?? 0,
    totalClicks: clickCount?.count ?? 0,
    uniqueVisitors: visitorRow?.count ?? 0,
    buyers,
    repeatBuyers,
    repeatBuyerRate: buyers > 0 ? Math.round((repeatBuyers / buyers) * 100) : 0,
  };
}

export async function getSignupTrend(range: ResolvedRange) {
  const { since, bucketMinutes } = range;
  const rows = await ordersDb
    .select({ bucket: bucketExpr(users.createdAt, bucketMinutes), count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, 'customer'), gte(users.createdAt, since)))
    .groupBy(sql`1`);
  return fillBucketedSeries(rows, since, bucketMinutes);
}

export async function getOrderTrend(range: ResolvedRange) {
  const { since, bucketMinutes } = range;
  const rows = await ordersDb
    .select({ bucket: bucketExpr(orders.createdAt, bucketMinutes), count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(activeOrderFilter(), gte(orders.createdAt, since)))
    .groupBy(sql`1`);
  return fillBucketedSeries(rows, since, bucketMinutes);
}

export async function getHottestItemsByCategory(range: ResolvedRange) {
  const { since } = range;
  const [activeOrders, productRows, categoryRows] = await Promise.all([
    ordersDb
      .select({ items: orders.items })
      .from(orders)
      .where(and(activeOrderFilter(), gte(orders.createdAt, since))),
    catalogDb
      .select({ id: products.id, name: products.name, categoryId: products.categoryId })
      .from(products),
    catalogDb.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));

  const soldByProduct = new Map<
    string,
    { name: string; categoryId: string | null; quantity: number; revenueInPence: number }
  >();
  for (const order of activeOrders) {
    for (const item of order.items) {
      const product = productById.get(item.productId);
      const existing = soldByProduct.get(item.productId) ?? {
        name: item.name,
        categoryId: product?.categoryId ?? null,
        quantity: 0,
        revenueInPence: 0,
      };
      existing.quantity += item.quantity;
      existing.revenueInPence += item.quantity * item.priceInPence;
      soldByProduct.set(item.productId, existing);
    }
  }

  const bestPerCategory = new Map<string, { productName: string; quantity: number; revenueInPence: number }>();
  for (const sold of soldByProduct.values()) {
    if (!sold.categoryId) continue;
    const current = bestPerCategory.get(sold.categoryId);
    if (!current || sold.quantity > current.quantity) {
      bestPerCategory.set(sold.categoryId, {
        productName: sold.name,
        quantity: sold.quantity,
        revenueInPence: sold.revenueInPence,
      });
    }
  }

  const hottestByCategory = categoryRows
    .map((c) => {
      const best = bestPerCategory.get(c.id);
      return best ? { categoryName: c.name, ...best } : null;
    })
    .filter((v): v is { categoryName: string; productName: string; quantity: number; revenueInPence: number } => v !== null)
    .sort((a, b) => b.quantity - a.quantity);

  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));
  const bestsellers = [...soldByProduct.values()]
    .map((s) => ({
      productName: s.name,
      categoryName: s.categoryId ? categoryNameById.get(s.categoryId) ?? 'Uncategorised' : 'Uncategorised',
      quantity: s.quantity,
      revenueInPence: s.revenueInPence,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return { hottestByCategory, bestsellers };
}

export async function getEngagementStats(range: ResolvedRange) {
  const { since } = range;
  const [topPages, topClicks] = await Promise.all([
    catalogDb
      .select({ path: analyticsEvents.path, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.type, 'pageview'), gte(analyticsEvents.createdAt, since)))
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    catalogDb
      .select({ label: analyticsEvents.label, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.type, 'click'), gte(analyticsEvents.createdAt, since)))
      .groupBy(analyticsEvents.label)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
  ]);

  return {
    topPages: topPages.map((p) => ({ path: p.path, count: p.count })),
    topClicks: topClicks
      .filter((c) => c.label)
      .map((c) => ({ label: c.label as string, count: c.count })),
  };
}

export async function getLocationStats(range: ResolvedRange) {
  const { since } = range;
  const [byCity, byFulfilment] = await Promise.all([
    ordersDb
      .select({
        city: sql<string>`coalesce(${orders.deliveryAddress}->>'city', 'Unknown')`,
        orderCount: sql<number>`count(*)::int`,
        revenueInPence: sql<number>`coalesce(sum(${orders.totalInPence}), 0)::int`,
      })
      .from(orders)
      .where(and(activeOrderFilter(), eq(orders.fulfilment, 'delivery'), gte(orders.createdAt, since)))
      .groupBy(sql`1`)
      .orderBy(desc(sql`count(*)`)),
    ordersDb
      .select({ fulfilment: orders.fulfilment, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(activeOrderFilter(), gte(orders.createdAt, since)))
      .groupBy(orders.fulfilment),
  ]);

  return {
    byCity,
    mostPopular: byCity.slice(0, 5),
    leastPopular: [...byCity].sort((a, b) => a.orderCount - b.orderCount).slice(0, 5),
    fulfilmentSplit: byFulfilment,
  };
}
