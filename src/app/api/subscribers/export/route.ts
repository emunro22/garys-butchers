import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

function escapeCsv(value: string | null | undefined): string {
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
    const all = await db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.subscribedAt));

    const header = ['Email', 'Name', 'Source', 'Active', 'Subscribed at', 'Unsubscribed at'];
    const rows = all.map((s) => [
      escapeCsv(s.email),
      escapeCsv(s.name),
      escapeCsv(s.source),
      s.isActive ? 'yes' : 'no',
      s.subscribedAt.toISOString(),
      s.unsubscribedAt ? s.unsubscribedAt.toISOString() : '',
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const filename = `garys-butchers-subscribers-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('subscribers export error', err);
    return NextResponse.json({ error: 'Could not export subscribers' }, { status: 500 });
  }
}