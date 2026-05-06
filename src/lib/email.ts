import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const FROM = process.env.RESEND_FROM_EMAIL || 'orders@garysbutchers.co.uk';
const SHOP_NOTIFY = process.env.SHOP_NOTIFY_EMAIL || 'gary@garysbutchers.co.uk';

type OrderEmailPayload = {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  fulfilment: 'pickup' | 'delivery';
  items: Array<{ name: string; quantity: number; priceInPence: number }>;
  subtotalInPence: number;
  deliveryInPence: number;
  discountInPence: number;
  totalInPence: number;
  pickupSlot?: string | null;
  deliverySlot?: string | null;
  deliveryAddress?: { line1: string; line2?: string; city: string; postcode: string } | null;
};

const fmt = (p: number) => `£${(p / 100).toFixed(2)}`;

function renderOrderHtml(o: OrderEmailPayload, audience: 'customer' | 'shop') {
  const itemsHtml = o.items
    .map(
      (i) => `
    <tr>
      <td style="padding:10px 0;color:#1a1815">${i.quantity} × ${i.name}</td>
      <td style="padding:10px 0;text-align:right;color:#1a1815">${fmt(i.priceInPence * i.quantity)}</td>
    </tr>`
    )
    .join('');

  const fulfilmentLine =
    o.fulfilment === 'pickup'
      ? `<strong>Collection</strong> from the shop${o.pickupSlot ? ` — ${new Date(o.pickupSlot).toLocaleString('en-GB')}` : ''}.`
      : `<strong>Home delivery</strong>${o.deliverySlot ? ` — ${new Date(o.deliverySlot).toLocaleString('en-GB')}` : ''}.<br/>${
          o.deliveryAddress
            ? `${o.deliveryAddress.line1}${o.deliveryAddress.line2 ? ', ' + o.deliveryAddress.line2 : ''}, ${o.deliveryAddress.city}, ${o.deliveryAddress.postcode}`
            : ''
        }`;

  const heading =
    audience === 'customer'
      ? `Thanks for your order, ${o.customerName.split(' ')[0]}.`
      : `New order #${o.orderNumber}`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f5f0;font-family:Georgia,serif;color:#1a1815">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #c9a96130">
        <p style="letter-spacing:0.3em;font-size:11px;color:#8e7138;margin:0">GARY'S BUTCHERS &amp; FISHMONGERS</p>
        <h1 style="font-size:26px;margin:8px 0 0;color:#0a0a0a">${heading}</h1>
        <p style="margin:8px 0 0;color:#4a443a">Order #${o.orderNumber}</p>
      </div>

      <div style="padding:24px 0;border-bottom:1px solid #c9a96130">
        <table style="width:100%;border-collapse:collapse;font-size:15px">${itemsHtml}</table>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
        <tr><td style="padding:4px 0">Subtotal</td><td style="text-align:right">${fmt(o.subtotalInPence)}</td></tr>
        ${o.discountInPence > 0 ? `<tr><td style="padding:4px 0;color:#8b1f1f">Discount</td><td style="text-align:right;color:#8b1f1f">−${fmt(o.discountInPence)}</td></tr>` : ''}
        <tr><td style="padding:4px 0">${o.fulfilment === 'pickup' ? 'Collection' : 'Delivery'}</td><td style="text-align:right">${o.deliveryInPence === 0 ? 'Free' : fmt(o.deliveryInPence)}</td></tr>
        <tr><td style="padding:12px 0 0;font-weight:bold;font-size:17px">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:17px">${fmt(o.totalInPence)}</td></tr>
      </table>

      <div style="margin-top:24px;padding:16px;background:#0a0a0a;color:#f8f5f0;border-radius:4px">
        ${fulfilmentLine}
      </div>

      <p style="margin-top:32px;color:#4a443a;font-size:13px;line-height:1.6">
        ${
          audience === 'customer'
            ? 'Any questions, give the shop a ring and we’ll sort it out. Thank you for supporting an independent local business.'
            : 'New order received. Reply to the customer if you need any clarifications.'
        }
      </p>
    </div>
  </body>
</html>`;
}

export async function sendOrderConfirmation(payload: OrderEmailPayload) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: payload.customerEmail,
    subject: `Order confirmed — #${payload.orderNumber}`,
    html: renderOrderHtml(payload, 'customer'),
  });
}

export async function sendShopNotification(payload: OrderEmailPayload) {
  await resend.emails.send({
    from: `Gary's Shop <${FROM}>`,
    to: SHOP_NOTIFY,
    subject: `🥩 New order #${payload.orderNumber} — ${payload.customerName}`,
    html: renderOrderHtml(payload, 'shop'),
  });
}

export async function sendContactMessage(opts: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  await resend.emails.send({
    from: `Gary's Website <${FROM}>`,
    to: SHOP_NOTIFY,
    replyTo: opts.email,
    subject: `New enquiry from ${opts.name}`,
    html: `
      <p><strong>${opts.name}</strong> &lt;${opts.email}&gt;${opts.phone ? ' · ' + opts.phone : ''}</p>
      <hr />
      <p style="white-space:pre-wrap">${opts.message.replace(/</g, '&lt;')}</p>
    `,
  });
}
