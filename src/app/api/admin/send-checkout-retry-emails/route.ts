import { NextRequest, NextResponse } from 'next/server';
import { sendCheckoutRetryEmail } from '@/lib/email';

// One-off: order #36 (jim.kearney@ntlworld.com) genuinely never completed
// payment (Stripe: requires_payment_method, amount_received 0) — notify
// them nothing was charged. Actual basket contents aren't known from the
// Stripe PaymentIntent alone, so this deliberately omits an item list
// rather than guessing. Remove this route once it's been run.
const RECIPIENTS = [
  {
    customerName: 'Jim Kearney',
    customerEmail: 'jim.kearney@ntlworld.com',
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
