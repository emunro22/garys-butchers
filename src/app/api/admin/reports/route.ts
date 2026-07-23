import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { buildSignupsReport, buildProductSalesReport } from '@/lib/reports';
import { sendReportEmail } from '@/lib/email';

const ReportSchema = z.object({
  type: z.enum(['signups', 'product-sales']),
  days: z.number().int().min(1).max(365),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please choose a report type and number of days' }, { status: 400 });
    }
    const { type, days } = parsed.data;
    const dayLabel = `${days} day${days === 1 ? '' : 's'}`;

    if (type === 'signups') {
      const report = await buildSignupsReport(days);
      await sendReportEmail({
        title: `New sign-ups — last ${dayLabel}`,
        summaryHtml: `<p style="margin:0;font-size:14px;color:#4a443a;line-height:1.6">Total new sign-ups: <strong>${report.total}</strong>. Full list attached as a CSV file.</p>`,
        filename: report.filename,
        csvContent: report.csv,
      });
      return NextResponse.json({ ok: true, total: report.total });
    } else {
      const report = await buildProductSalesReport(days);
      await sendReportEmail({
        title: `Product sales — last ${dayLabel}`,
        summaryHtml: `<p style="margin:0;font-size:14px;color:#4a443a;line-height:1.6">Across <strong>${report.totalOrders}</strong> paid order${report.totalOrders === 1 ? '' : 's'} · <strong>${report.totalProducts}</strong> distinct product${report.totalProducts === 1 ? '' : 's'} sold. Full breakdown attached as a CSV file.</p>`,
        filename: report.filename,
        csvContent: report.csv,
      });
      return NextResponse.json({ ok: true, totalOrders: report.totalOrders });
    }
  } catch (err) {
    console.error('report error', err);
    return NextResponse.json({ error: 'Could not generate or send that report' }, { status: 500 });
  }
}
