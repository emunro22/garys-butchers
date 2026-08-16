import Link from 'next/link';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { eq } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order confirmed — Gary’s Butchers & Fishmongers',
  description: 'Thanks for your order at Gary’s Butchers & Fishmongers.',
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let order: any = null;
  if (orderId) {
    try {
      await ensureOrdersSchema();
      [order] = await ordersDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    } catch {
      // ignore — show generic success
    }
  }

  // Payment is confirmed by this point (Stripe already redirected/returned
  // success) — the order number is normally assigned synchronously before
  // this page loads, but for redirect-based payment methods that bypass our
  // client JS, it depends on the Stripe webhook, which can very briefly lag.
  const stillConfirming = order?.status === 'pending';

  return (
    <div className="bg-cream-50 min-h-[70vh]">
      {stillConfirming && <meta httpEquiv="refresh" content="3" />}
      <section className="mx-auto max-w-3xl px-4 md:px-8 py-20 md:py-28 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto text-gold-500" strokeWidth={1.5} />
        <p className="eyebrow text-ink-500 mt-6 mb-3">Order confirmed</p>
        <h1 className="font-display text-5xl md:text-6xl text-ink-900 leading-[0.95]">
          Thanks{order?.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-5 text-ink-700 max-w-xl mx-auto leading-relaxed">
          {order?.fulfilment === 'premium'
            ? "We're preparing your order. You'll get a confirmation email shortly, and a separate email with your tracking number once it's on its way."
            : "We've received your order and we're on it. You'll get a confirmation email in the next minute or two."}
        </p>

        {order && stillConfirming && (
          <p className="mt-10 text-sm text-ink-500">
            Just finalising your order details — this will update automatically in a moment.
          </p>
        )}

        {order && !stillConfirming && (
          <div className="mt-10 bg-cream-100 border border-ink-900/10 p-6 md:p-8 text-left max-w-md mx-auto">
            <div className="flex items-baseline justify-between border-b border-ink-900/10 pb-3 mb-3">
              <p className="eyebrow text-ink-500">Order number</p>
              <p className="font-display text-xl text-ink-900 tabular">
                #{String(order.orderNumber).padStart(5, '0')}
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-700">Total paid</dt>
                <dd className="tabular text-ink-900 font-medium">
                  {formatPrice(order.totalInPence)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-700">
                  {order.fulfilment === 'pickup'
                    ? 'Collection'
                    : order.fulfilment === 'premium'
                    ? 'Premium delivery'
                    : 'Delivery'}
                </dt>
                <dd className="text-ink-900">
                  {(order.deliverySlot || order.pickupSlot)
                    ? new Date(order.deliverySlot ?? order.pickupSlot).toLocaleString(
                        'en-GB',
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/London',
                        }
                      )
                    : 'TBC'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <p className="mt-8 inline-flex items-center gap-2 text-sm text-ink-500">
          <Mail className="h-4 w-4" /> A receipt will be in your inbox shortly.
        </p>

        <div className="mt-10 flex justify-center gap-3">
          <Link href="/shop">
            <Button variant="primary">Keep shopping</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back home</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
