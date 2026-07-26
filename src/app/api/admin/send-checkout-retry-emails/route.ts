import { NextRequest, NextResponse } from 'next/server';
import { sendCheckoutRetryEmail } from '@/lib/email';

// One-off: notify the customers whose orders were wrongly auto-cancelled
// by the (since-fixed) 20-minute checkout-expiry bug, so they know nothing
// was charged and can reorder. Remove this route once it's been run.
const RECIPIENTS = [
  {
    customerName: 'Frances Robertson',
    customerEmail: 'frannyrobertson65@gmail.com',
    items: [{ name: "Manager's Special", quantity: 1, priceInPence: 6000 }],
    totalInPence: 6000,
  },
  {
    customerName: 'Joan Dowdall',
    customerEmail: 'joandowdall@virginmedia.com',
    items: [
      { name: '4oz Steak Burger', quantity: 6, priceInPence: 185 },
      { name: 'Beef Olives', quantity: 6, priceInPence: 195 },
      { name: 'Less Than 5% Fat Diced Stewing Beef (1kg)', quantity: 1, priceInPence: 1485 },
    ],
    totalInPence: 3765,
  },
  {
    customerName: 'Katrina Hannah',
    customerEmail: 'katmcbride89@googlemail.com',
    items: [{ name: "Manager's Special", quantity: 1, priceInPence: 6000 }],
    totalInPence: 6000,
  },
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];
  for (const r of RECIPIENTS) {
    try {
      await sendCheckoutRetryEmail(r);
      results.push({ email: r.customerEmail, ok: true });
    } catch (err) {
      results.push({ email: r.customerEmail, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ results });
}
