import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

function escapeCsv(value: string | null | undefined | number): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await db
      .select({
        email: orders.customerEmail,
        name: sql<string>`max(${orders.customerName})`,
        phone: sql<string>`max(${orders.customerPhone})`,
        orderCount: sql<number>`count(*)::int`,
        totalSpentInPence: sql<number>`sum(${orders.totalInPence})::int`,
        firstOrder: sql<Date>`min(${orders.createdAt})`,
        lastOrder: sql<Date>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(sql`${orders.status} in ('paid', 'preparing', 'ready', 'completed')`)
      .groupBy(orders.customerEmail)
      .orderBy(sql`max(${orders.createdAt}) desc`);

    const header = [
      'Email',
      'Name',
      'Phone',
      'Order count',
      'Total spent (£)',
      'First order',
      'Last order',
    ];
    const csvRows = rows.map((r) => [
      escapeCsv(r.email),
      escapeCsv(r.name),
      escapeCsv(r.phone),
      r.orderCount,
      (r.totalSpentInPence / 100).toFixed(2),
      new Date(r.firstOrder).toISOString(),
      new Date(r.lastOrder).toISOString(),
    ]);

    const csv = [header.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const filename = `garys-butchers-customers-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('customers export error', err);
    return NextResponse.json({ error: 'Could not export customers' }, { status: 500 });
  }
}