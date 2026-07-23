import { db } from '@/lib/db';
import { users, orders } from '@/lib/db/schema';
import { gte, and, notInArray } from 'drizzle-orm';
import { toCsv } from '@/lib/csv';

function cutoffDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function periodLabel(days: number, since: Date): string {
  return `Last ${days} day${days === 1 ? '' : 's'} (since ${since.toLocaleDateString('en-GB')})`;
}

export async function buildSignupsReport(days: number) {
  const since = cutoffDate(days);
  const rows = await db.select().from(users).where(gte(users.createdAt, since));
  const sorted = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const csvRows: Array<Array<string | number>> = [
    ['Report', 'New customer sign-ups'],
    ['Period', periodLabel(days, since)],
    ['Total sign-ups', sorted.length],
    [],
    ['Name', 'Email', 'Phone', 'Verified', 'Signed up'],
    ...sorted.map((u) => [
      u.name,
      u.email,
      u.phone ?? '',
      u.emailVerified ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleString('en-GB'),
    ]),
  ];

  return {
    csv: toCsv(csvRows),
    total: sorted.length,
    filename: `signups-last-${days}-days.csv`,
  };
}

export async function buildProductSalesReport(days: number) {
  const since = cutoffDate(days);
  const rows = await db
    .select({ items: orders.items })
    .from(orders)
    .where(and(gte(orders.createdAt, since), notInArray(orders.status, ['pending', 'cancelled', 'refunded'])));

  const totals = new Map<string, { name: string; quantity: number; revenueInPence: number }>();
  for (const row of rows) {
    for (const item of row.items) {
      const existing = totals.get(item.name) ?? { name: item.name, quantity: 0, revenueInPence: 0 };
      existing.quantity += item.quantity;
      existing.revenueInPence += item.quantity * item.priceInPence;
      totals.set(item.name, existing);
    }
  }
  const sorted = [...totals.values()].sort((a, b) => b.quantity - a.quantity);

  const csvRows: Array<Array<string | number>> = [
    ['Report', 'Product sales'],
    ['Period', periodLabel(days, since)],
    ['Total paid orders', rows.length],
    [],
    ['Product', 'Quantity sold', 'Revenue (£)'],
    ...sorted.map((p) => [p.name, p.quantity, (p.revenueInPence / 100).toFixed(2)]),
  ];

  return {
    csv: toCsv(csvRows),
    totalOrders: rows.length,
    totalProducts: sorted.length,
    filename: `product-sales-last-${days}-days.csv`,
  };
}
