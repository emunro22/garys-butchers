import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendCustomerMessage } from '@/lib/email';

const BodySchema = z.object({
  orderId: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { orderId, subject, message } = parsed.data;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    await sendCustomerMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      subject,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('orders email send error', err);
    return NextResponse.json({ error: 'Could not send email' }, { status: 500 });
  }
}
