import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const FROM = process.env.RESEND_FROM_EMAIL || 'orders@garysbutchersandfishmongers.co.uk';

// Admin/shop notification recipient — all order and contact emails go here
const ADMIN_EMAILS = [
  process.env.SHOP_NOTIFY_EMAIL || 'garysbutchers-confirmation@outlook.com',
];

type OrderEmailPayload = {
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  fulfilment: 'pickup' | 'delivery';
  items: Array<{ name: string; quantity: number; priceInPence: number }>;
  subtotalInPence: number;
  deliveryInPence: number;
  discountInPence: number;
  totalInPence: number;
  pickupSlot?: string | null;
  deliverySlot?: string | null;
  deliveryAddress?: { line1: string; line2?: string; city: string; postcode: string } | null;
  notes?: string | null;
  promotionCode?: string | null;
};

const fmt = (p: number) => `£${(p / 100).toFixed(2)}`;

function formatSlot(iso: string | null | undefined) {
  if (!iso) return 'TBC';
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Customer confirmation email ────────────────────────────────────────────

function renderCustomerHtml(o: OrderEmailPayload) {
  const itemsHtml = o.items
    .map(
      (i) => `
    <tr>
      <td style="padding:10px 0;color:#1a1815;border-bottom:1px solid #e8e0d4">${i.quantity} × ${i.name}</td>
      <td style="padding:10px 0;text-align:right;color:#1a1815;border-bottom:1px solid #e8e0d4">${fmt(i.priceInPence * i.quantity)}</td>
    </tr>`
    )
    .join('');

  const slotLine =
    o.fulfilment === 'pickup'
      ? `<strong>Collection:</strong> ${formatSlot(o.pickupSlot)}`
      : `<strong>Home delivery:</strong> ${formatSlot(o.deliverySlot)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f5f0;font-family:Georgia,serif;color:#1a1815">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">

      <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid #c9a961">
        <p style="letter-spacing:0.3em;font-size:11px;color:#8e7138;margin:0">GARY'S BUTCHERS &amp; FISHMONGERS</p>
        <h1 style="font-size:26px;margin:10px 0 4px;color:#0a0a0a">Thanks, ${o.customerName.split(' ')[0]}.</h1>
        <p style="margin:0;color:#4a443a;font-size:14px">Your order has been confirmed.</p>
      </div>

      <p style="margin:24px 0 0;font-size:14px;color:#4a443a">
        Order <strong>#${String(o.orderNumber).padStart(5, '0')}</strong>
      </p>

      <div style="margin-top:16px;padding:16px;background:#0a0a0a;color:#f8f5f0;border-radius:4px;font-size:14px;line-height:1.6">
        ${slotLine}
        ${
          o.fulfilment === 'delivery' && o.deliveryAddress
            ? `<br/><span style="color:#c9a961">${o.deliveryAddress.line1}${o.deliveryAddress.line2 ? ', ' + o.deliveryAddress.line2 : ''}, ${o.deliveryAddress.city}, ${o.deliveryAddress.postcode.toUpperCase()}</span>`
            : ''
        }
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:24px">
        ${itemsHtml}
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
        <tr><td style="padding:4px 0;color:#4a443a">Subtotal</td><td style="text-align:right">${fmt(o.subtotalInPence)}</td></tr>
        ${o.discountInPence > 0 ? `<tr><td style="padding:4px 0;color:#8b1f1f">Discount${o.promotionCode ? ` (${o.promotionCode})` : ''}</td><td style="text-align:right;color:#8b1f1f">−${fmt(o.discountInPence)}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#4a443a">${o.fulfilment === 'pickup' ? 'Collection' : 'Delivery'}</td><td style="text-align:right">${o.deliveryInPence === 0 ? 'Free' : fmt(o.deliveryInPence)}</td></tr>
        <tr style="border-top:2px solid #c9a961">
          <td style="padding:10px 0 0;font-weight:bold;font-size:17px">Total paid</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:bold;font-size:17px">${fmt(o.totalInPence)}</td>
        </tr>
      </table>

      <p style="margin-top:32px;color:#4a443a;font-size:13px;line-height:1.7;border-top:1px solid #e8e0d4;padding-top:20px">
        Any questions, give us a ring and we'll sort it out. Thank you for supporting a local independent business.
      </p>
    </div>
  </body>
</html>`;
}

// ─── Admin / shop notification email ────────────────────────────────────────

function renderAdminHtml(o: OrderEmailPayload) {
  const itemsHtml = o.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e8e0d4">${i.quantity} × ${i.name}</td>
      <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e8e0d4">${fmt(i.priceInPence * i.quantity)}</td>
    </tr>`
    )
    .join('');

  const fulfilmentBlock =
    o.fulfilment === 'pickup'
      ? `<tr>
          <td style="padding:6px 0;color:#6b5d4f;width:130px">Type</td>
          <td style="padding:6px 0;font-weight:600;color:#2d5a27">COLLECTION</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b5d4f">Slot</td>
          <td style="padding:6px 0;font-weight:600">${formatSlot(o.pickupSlot)}</td>
        </tr>`
      : `<tr>
          <td style="padding:6px 0;color:#6b5d4f;width:130px">Type</td>
          <td style="padding:6px 0;font-weight:600;color:#1a4d8f">HOME DELIVERY</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b5d4f">Slot</td>
          <td style="padding:6px 0;font-weight:600">${formatSlot(o.deliverySlot)}</td>
        </tr>
        ${
          o.deliveryAddress
            ? `<tr>
                <td style="padding:6px 0;color:#6b5d4f;vertical-align:top">Address</td>
                <td style="padding:6px 0">
                  ${o.deliveryAddress.line1}${o.deliveryAddress.line2 ? '<br/>' + o.deliveryAddress.line2 : ''}
                  <br/>${o.deliveryAddress.city}
                  <br/><strong>${o.deliveryAddress.postcode.toUpperCase()}</strong>
                </td>
              </tr>`
            : ''
        }`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#1a1815">
    <div style="max-width:620px;margin:0 auto;padding:24px 16px">

      <div style="background:#0a0a0a;color:#f8f5f0;padding:20px 24px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:space-between">
        <div>
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;color:#c9a961">GARY'S BUTCHERS — NEW ORDER</p>
          <h1 style="margin:6px 0 0;font-size:24px">Order #${String(o.orderNumber).padStart(5, '0')}</h1>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#c9a961">${fmt(o.totalInPence)}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#aaa">${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <!-- Customer details -->
      <div style="background:#fff;padding:20px 24px;border:1px solid #ddd;border-top:none">
        <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Customer</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:5px 0;color:#6b5d4f;width:110px">Name</td>
            <td style="padding:5px 0;font-weight:600">${o.customerName}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#6b5d4f">Email</td>
            <td style="padding:5px 0"><a href="mailto:${o.customerEmail}" style="color:#1a4d8f">${o.customerEmail}</a></td>
          </tr>
          ${o.customerPhone ? `<tr><td style="padding:5px 0;color:#6b5d4f">Phone</td><td style="padding:5px 0;font-weight:600"><a href="tel:${o.customerPhone}" style="color:#1a1815">${o.customerPhone}</a></td></tr>` : ''}
        </table>
      </div>

      <!-- Fulfilment -->
      <div style="background:#fff;padding:20px 24px;border:1px solid #ddd;border-top:none">
        <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Fulfilment</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${fulfilmentBlock}
        </table>
      </div>

      <!-- Items -->
      <div style="background:#fff;padding:20px 24px;border:1px solid #ddd;border-top:none">
        <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Items ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${itemsHtml}
        </table>
      </div>

      <!-- Totals -->
      <div style="background:#fff;padding:20px 24px;border:1px solid #ddd;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 0;color:#6b5d4f">Subtotal</td><td style="text-align:right">${fmt(o.subtotalInPence)}</td></tr>
          ${o.discountInPence > 0 ? `<tr><td style="padding:4px 0;color:#8b1f1f">Discount${o.promotionCode ? ` — code: <strong>${o.promotionCode}</strong>` : ''}</td><td style="text-align:right;color:#8b1f1f">−${fmt(o.discountInPence)}</td></tr>` : ''}
          ${o.promotionCode && o.discountInPence === 0 ? `<tr><td style="padding:4px 0;color:#6b5d4f">Promo code</td><td style="text-align:right">${o.promotionCode} (free delivery)</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#6b5d4f">${o.fulfilment === 'pickup' ? 'Collection' : 'Delivery'}</td><td style="text-align:right">${o.deliveryInPence === 0 ? 'Free' : fmt(o.deliveryInPence)}</td></tr>
          <tr style="border-top:2px solid #c9a961">
            <td style="padding:10px 0 0;font-weight:bold;font-size:16px">Total</td>
            <td style="padding:10px 0 0;text-align:right;font-weight:bold;font-size:16px">${fmt(o.totalInPence)}</td>
          </tr>
        </table>
      </div>

      ${
        o.notes
          ? `<div style="background:#fffbf0;padding:16px 24px;border:1px solid #f0d080;border-top:none;border-radius:0 0 6px 6px">
              <h2 style="margin:0 0 6px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Customer notes</h2>
              <p style="margin:0;font-size:14px;color:#1a1815;white-space:pre-wrap">${o.notes.replace(/</g, '&lt;')}</p>
            </div>`
          : '<div style="height:6px;background:#0a0a0a;border-radius:0 0 6px 6px"></div>'
      }

    </div>
  </body>
</html>`;
}

// ─── Verification code email ────────────────────────────────────────────────

function renderVerificationHtml(name: string, code: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f5f0;font-family:Georgia,serif;color:#1a1815">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid #c9a961">
        <p style="letter-spacing:0.3em;font-size:11px;color:#8e7138;margin:0">GARY'S BUTCHERS &amp; FISHMONGERS</p>
        <h1 style="font-size:26px;margin:10px 0 4px;color:#0a0a0a">Verify your email</h1>
        <p style="margin:0;color:#4a443a;font-size:14px">Welcome, ${name.split(' ')[0]}!</p>
      </div>
      <p style="margin:24px 0 8px;font-size:14px;color:#4a443a;line-height:1.7">
        Enter this verification code to complete your registration:
      </p>
      <div style="margin:16px 0 24px;padding:20px;background:#0a0a0a;text-align:center;border-radius:4px">
        <p style="margin:0;font-size:36px;letter-spacing:0.4em;font-weight:bold;color:#c9a961;font-family:monospace">${code}</p>
      </div>
      <p style="font-size:13px;color:#4a443a;line-height:1.7">
        This code expires in <strong>15 minutes</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="margin-top:32px;color:#4a443a;font-size:13px;line-height:1.7;border-top:1px solid #e8e0d4;padding-top:20px">
        Thank you for joining us — we look forward to serving you.
      </p>
    </div>
  </body>
</html>`;
}

// ─── Password reset email ───────────────────────────────────────────────────

function renderResetHtml(name: string, code: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f5f0;font-family:Georgia,serif;color:#1a1815">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;padding-bottom:24px;border-bottom:2px solid #c9a961">
        <p style="letter-spacing:0.3em;font-size:11px;color:#8e7138;margin:0">GARY'S BUTCHERS &amp; FISHMONGERS</p>
        <h1 style="font-size:26px;margin:10px 0 4px;color:#0a0a0a">Reset your password</h1>
      </div>
      <p style="margin:24px 0 8px;font-size:14px;color:#4a443a;line-height:1.7">
        Hi ${name.split(' ')[0]}, we received a request to reset your password. Use this code:
      </p>
      <div style="margin:16px 0 24px;padding:20px;background:#0a0a0a;text-align:center;border-radius:4px">
        <p style="margin:0;font-size:36px;letter-spacing:0.4em;font-weight:bold;color:#c9a961;font-family:monospace">${code}</p>
      </div>
      <p style="font-size:13px;color:#4a443a;line-height:1.7">
        This code expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
      </p>
      <p style="margin-top:32px;color:#4a443a;font-size:13px;line-height:1.7;border-top:1px solid #e8e0d4;padding-top:20px">
        Need help? Reply to this email and we'll sort it out.
      </p>
    </div>
  </body>
</html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendOrderConfirmation(payload: OrderEmailPayload) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: payload.customerEmail,
    subject: `Order confirmed — #${String(payload.orderNumber).padStart(5, '0')}`,
    html: renderCustomerHtml(payload),
  });
}

export async function sendShopNotification(payload: OrderEmailPayload) {
  await resend.emails.send({
    from: `Gary's Butchers Orders <${FROM}>`,
    to: ADMIN_EMAILS,
    subject: `🥩 New order #${String(payload.orderNumber).padStart(5, '0')} — ${payload.customerName} — ${fmt(payload.totalInPence)}`,
    html: renderAdminHtml(payload),
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
    to: ADMIN_EMAILS,
    replyTo: opts.email,
    subject: `New enquiry from ${opts.name}`,
    html: `
      <p><strong>${opts.name}</strong> &lt;${opts.email}&gt;${opts.phone ? ' · ' + opts.phone : ''}</p>
      <hr />
      <p style="white-space:pre-wrap">${opts.message.replace(/</g, '&lt;')}</p>
    `,
  });
}

export async function sendVerificationCode(email: string, name: string, code: string) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: email,
    subject: `Your verification code: ${code}`,
    html: renderVerificationHtml(name, code),
  });
}

export async function sendPasswordResetCode(email: string, name: string, code: string) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: email,
    subject: `Password reset code: ${code}`,
    html: renderResetHtml(name, code),
  });
}

export async function sendNewCustomerNotification(customer: {
  name: string;
  email: string;
  phone?: string | null;
}) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: ADMIN_EMAILS,
    subject: `New customer sign-up — ${customer.name}`,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#1a1815">
    <div style="max-width:620px;margin:0 auto;padding:24px 16px">

      <!-- Header -->
      <div style="background:#0a0a0a;color:#f8f5f0;padding:24px 28px;border-radius:6px 6px 0 0">
        <table style="width:100%"><tr>
          <td>
            <p style="margin:0;font-size:11px;letter-spacing:0.25em;color:#c9a961">GARY'S BUTCHERS &amp; FISHMONGERS</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700">New Customer Sign-Up</h1>
          </td>
          <td style="text-align:right;vertical-align:top">
            <p style="margin:0;font-size:28px">👋</p>
          </td>
        </tr></table>
      </div>

      <!-- Customer details -->
      <div style="background:#fff;padding:24px 28px;border:1px solid #ddd;border-top:none">
        <h2 style="margin:0 0 14px;font-size:13px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Customer Details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 0;color:#6b5d4f;width:110px;border-bottom:1px solid #f0ebe3">Name</td>
            <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f0ebe3">${customer.name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b5d4f;border-bottom:1px solid #f0ebe3">Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #f0ebe3"><a href="mailto:${customer.email}" style="color:#1a4d8f;text-decoration:none">${customer.email}</a></td>
          </tr>
          ${customer.phone ? `<tr><td style="padding:8px 0;color:#6b5d4f;border-bottom:1px solid #f0ebe3">Phone</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f0ebe3"><a href="tel:${customer.phone}" style="color:#1a1815;text-decoration:none">${customer.phone}</a></td></tr>` : ''}
          <tr>
            <td style="padding:8px 0;color:#6b5d4f">Registered</td>
            <td style="padding:8px 0">${new Date().toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#faf8f5;padding:16px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 6px 6px">
        <p style="margin:0;font-size:12px;color:#8e7138;line-height:1.6">
          This customer has verified their email and can now place orders. View their profile in the <a href="https://garysbutchersandfishmongers.co.uk/admin/customers" style="color:#1a4d8f;text-decoration:none;font-weight:600">admin dashboard</a>.
        </p>
      </div>

    </div>
  </body>
</html>`,
  });
}
