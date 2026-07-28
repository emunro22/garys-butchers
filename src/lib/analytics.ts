import { db } from '@/lib/db';
import { users, orders, products, categories, analyticsEvents } from '@/lib/db/schema';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { activeOrderFilter } from '@/lib/order-status';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Builds a continuous daily series over the last `days` days, filling gaps with 0
 *  so the chart never silently skips a day with no activity. */
function fillDailySeries(
  rows: Array<{ day: string; count: number }>,
  days: number
): Array<{ date: string; count: number }> {
  const byDay = new Map(rows.map((r) => [r.day.slice(0, 10), r.count]));
  const series: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return series;
}

export async function getOverviewStats() {
  const since30 = daysAgo(30);

  const [[customerCount], [newCustomers], [orderCount], [ordersLast30], [revenueRow], [pageviewCount], [clickCount], [visitorRow]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'customer')),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.role, 'customer'), gte(users.createdAt, since30))),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(activeOrderFilter()),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(activeOrderFilter(), gte(orders.createdAt, since30))),
      db
        .select({ total: sql<number>`coalesce(sum(${orders.totalInPence}), 0)::int` })
        .from(orders)
        .where(activeOrderFilter()),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.type, 'pageview')),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.type, 'click')),
      db
        .select({ count: sql<number>`count(distinct ${analyticsEvents.sessionId})::int` })
        .from(analyticsEvents),
    ]);

  const totalOrders = orderCount?.count ?? 0;
  const revenue = revenueRow?.total ?? 0;

  // Repeat customers = distinct customer emails with more than one real order.
  const repeatRows = await db
    .select({ email: orders.customerEmail, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(activeOrderFilter())
    .groupBy(orders.customerEmail);
  const buyers = repeatRows.length;
  const repeatBuyers = repeatRows.filter((r) => r.count > 1).length;

  return {
    totalCustomers: customerCount?.count ?? 0,
    newCustomersLast30Days: newCustomers?.count ?? 0,
    totalOrders,
    ordersLast30Days: ordersLast30?.count ?? 0,
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

export async function getSignupTrend(days = 30) {
  const since = daysAgo(days - 1);
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(and(eq(users.role, 'customer'), gte(users.createdAt, since)))
    .groupBy(sql`1`);
  return fillDailySeries(rows, days);
}

export async function getOrderTrend(days = 30) {
  const since = daysAgo(days - 1);
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(activeOrderFilter(), gte(orders.createdAt, since)))
    .groupBy(sql`1`);
  return fillDailySeries(rows, days);
}

export async function getHottestItemsByCategory() {
  const [activeOrders, productRows, categoryRows] = await Promise.all([
    db.select({ items: orders.items }).from(orders).where(activeOrderFilter()),
    db
      .select({ id: products.id, name: products.name, categoryId: products.categoryId })
      .from(products),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

  const soldByProduct = new Map<string, { name: string; categoryId: string | null; quantity: number; revenueInPence: number }>();
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

export async function getEngagementStats() {
  const [topPages, topClicks] = await Promise.all([
    db
      .select({ path: analyticsEvents.path, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.type, 'pageview'))
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    db
      .select({ label: analyticsEvents.label, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.type, 'click'))
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

export async function getLocationStats() {
  const [byCity, byFulfilment] = await Promise.all([
    db
      .select({
        city: sql<string>`coalesce(${orders.deliveryAddress}->>'city', 'Unknown')`,
        orderCount: sql<number>`count(*)::int`,
        revenueInPence: sql<number>`coalesce(sum(${orders.totalInPence}), 0)::int`,
      })
      .from(orders)
      .where(and(activeOrderFilter(), eq(orders.fulfilment, 'delivery')))
      .groupBy(sql`1`)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ fulfilment: orders.fulfilment, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(activeOrderFilter())
      .groupBy(orders.fulfilment),
  ]);

  return {
    byCity,
    mostPopular: byCity.slice(0, 5),
    leastPopular: [...byCity].sort((a, b) => a.orderCount - b.orderCount).slice(0, 5),
    fulfilmentSplit: byFulfilment,
  };
}
