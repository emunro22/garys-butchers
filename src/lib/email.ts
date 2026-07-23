import { Resend } from 'resend';
import { isToday } from '@/lib/same-day-slots';

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const FROM = process.env.RESEND_FROM_EMAIL || 'orders@garysbutchersandfishmongers.co.uk';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://garysbutchersandfishmongers.co.uk';
const LOGO_URL = `${SITE_URL}/logo-email.png`;

// Most mail clients (Gmail, Outlook, etc.) hide remote <img> sources behind a
// "display images" click-through by default, which made the logo look
// "missing" even though the URL was correct. Embedding it as an inline
// (cid:) attachment instead renders immediately, with no click-through.
const LOGO_CID = 'garys-logo';
let logoAttachmentCache: Array<{ filename: string; content: Buffer; contentType: string; inlineContentId: string }> | null = null;

async function getLogoAttachment() {
  if (logoAttachmentCache) return logoAttachmentCache;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return [];
    const content = Buffer.from(await res.arrayBuffer());
    logoAttachmentCache = [{ filename: 'logo.png', content, contentType: 'image/png', inlineContentId: LOGO_CID }];
    return logoAttachmentCache;
  } catch {
    return [];
  }
}

// Admin/shop notification recipient — same address used to log into the admin portal
const ADMIN_EMAILS = [process.env.ADMIN_EMAIL!];

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

// ─── Shared layout — every email in the app renders through this ───────────

const FONT_STACK = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

function renderEmailLayout(opts: {
  eyebrow?: string;
  title: string;
  intro?: string;
  bodyHtml: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f1ea;font-family:${FONT_STACK};color:#1a1815">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(10,10,10,0.1)">

      <div style="background:#0a0a0a;padding:28px 24px;text-align:center">
        <img src="cid:${LOGO_CID}" width="56" height="56" alt="Gary's Butchers &amp; Fishmongers" style="display:block;margin:0 auto 10px;border-radius:50%" />
        <p style="margin:0;letter-spacing:0.2em;font-size:11px;color:#c9a961;text-transform:uppercase">Gary's Butchers &amp; Fishmongers</p>
      </div>

      <div style="padding:32px 28px">
        ${opts.eyebrow ? `<p style="margin:0 0 6px;letter-spacing:0.18em;font-size:11px;color:#8e7138;text-transform:uppercase">${opts.eyebrow}</p>` : ''}
        <h1 style="margin:0 0 10px;font-size:23px;color:#0a0a0a">${opts.title}</h1>
        ${opts.intro ? `<p style="margin:0 0 22px;color:#4a443a;font-size:14px;line-height:1.6">${opts.intro}</p>` : ''}
        ${opts.bodyHtml}
      </div>

      <div style="padding:18px 28px;border-top:1px solid #eee2d0;background:#faf8f5">
        <p style="margin:0;font-size:12px;color:#8e7138;line-height:1.6">
          Gary's Butchers &amp; Fishmongers · 19 Park Glade Shops, Erskine, PA8 7HH · 0141 959 0478
        </p>
      </div>

    </div>
  </body>
</html>`;
}

// ─── Customer confirmation email ────────────────────────────────────────────

function renderCustomerHtml(o: OrderEmailPayload) {
  const itemsHtml = o.items
    .map(
      (i) => `
    <tr>
      <td style="padding:10px 0;color:#1a1815;border-bottom:1px solid #f0ebe3">${i.quantity} × ${i.name}</td>
      <td style="padding:10px 0;text-align:right;color:#1a1815;border-bottom:1px solid #f0ebe3">${fmt(i.priceInPence * i.quantity)}</td>
    </tr>`
    )
    .join('');

  const slotLine =
    o.fulfilment === 'pickup'
      ? `<strong>Collection:</strong> ${formatSlot(o.pickupSlot)}`
      : `<strong>Home delivery:</strong> ${formatSlot(o.deliverySlot)}`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:14px;color:#4a443a">
      Order <strong>#${String(o.orderNumber).padStart(5, '0')}</strong>
    </p>

    <div style="margin-bottom:20px;padding:16px;background:#0a0a0a;color:#f8f5f0;border-radius:8px;font-size:14px;line-height:1.6">
      ${slotLine}
      ${
        o.fulfilment === 'delivery' && o.deliveryAddress
          ? `<br/><span style="color:#c9a961">${o.deliveryAddress.line1}${o.deliveryAddress.line2 ? ', ' + o.deliveryAddress.line2 : ''}, ${o.deliveryAddress.city}, ${o.deliveryAddress.postcode.toUpperCase()}</span>`
          : ''
      }
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:15px">
      ${itemsHtml}
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:14px">
      <tr><td style="padding:4px 0;color:#4a443a">Subtotal</td><td style="text-align:right">${fmt(o.subtotalInPence)}</td></tr>
      ${o.discountInPence > 0 ? `<tr><td style="padding:4px 0;color:#8b1f1f">Discount${o.promotionCode ? ` (${o.promotionCode})` : ''}</td><td style="text-align:right;color:#8b1f1f">−${fmt(o.discountInPence)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#4a443a">${o.fulfilment === 'pickup' ? 'Collection' : 'Delivery'}</td><td style="text-align:right">${o.deliveryInPence === 0 ? 'Free' : fmt(o.deliveryInPence)}</td></tr>
      <tr style="border-top:2px solid #c9a961">
        <td style="padding:10px 0 0;font-weight:bold;font-size:17px">Total paid</td>
        <td style="padding:10px 0 0;text-align:right;font-weight:bold;font-size:17px">${fmt(o.totalInPence)}</td>
      </tr>
    </table>

    <p style="margin-top:24px;color:#4a443a;font-size:13px;line-height:1.7;border-top:1px solid #f0ebe3;padding-top:18px">
      Any questions, give us a ring and we'll sort it out. Thank you for supporting a local independent business.
    </p>`;

  return renderEmailLayout({
    eyebrow: 'Order confirmed',
    title: `Thanks, ${o.customerName.split(' ')[0]}.`,
    intro: 'Your order has been confirmed.',
    bodyHtml,
  });
}

// ─── Admin / shop notification email ────────────────────────────────────────

function renderAdminHtml(o: OrderEmailPayload) {
  const itemsHtml = o.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ebe3">${i.quantity} × ${i.name}</td>
      <td style="padding:8px 0;text-align:right;border-bottom:1px solid #f0ebe3">${fmt(i.priceInPence * i.quantity)}</td>
    </tr>`
    )
    .join('');

  const isSameDayOrder = o.fulfilment === 'delivery' && !!o.deliverySlot && isToday(new Date(o.deliverySlot));

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
          <td style="padding:6px 0;font-weight:600;color:#1a4d8f">HOME DELIVERY${isSameDayOrder ? ' — SAME DAY' : ''}</td>
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

  const bodyHtml = `
    <div style="margin-bottom:20px;padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px">
      <h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Customer</h2>
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

    <div style="margin-bottom:20px;padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px">
      <h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Fulfilment</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${fulfilmentBlock}
      </table>
    </div>

    <div style="margin-bottom:20px;padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px">
      <h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Items ordered</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${itemsHtml}
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px">
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
        ? `<div style="padding:16px;background:#fffbf0;border:1px solid #f0d080;border-radius:8px">
            <h2 style="margin:0 0 6px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Customer notes</h2>
            <p style="margin:0;font-size:14px;color:#1a1815;white-space:pre-wrap">${o.notes.replace(/</g, '&lt;')}</p>
          </div>`
        : ''
    }`;

  return renderEmailLayout({
    eyebrow: 'New order',
    title: `Order #${String(o.orderNumber).padStart(5, '0')} — ${fmt(o.totalInPence)}`,
    intro: new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    bodyHtml,
  });
}

// ─── Verification code email ────────────────────────────────────────────────

function renderVerificationHtml(name: string, code: string) {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:14px;color:#4a443a;line-height:1.7">
      Enter this verification code to complete your registration:
    </p>
    <div style="margin:16px 0 24px;padding:20px;background:#0a0a0a;text-align:center;border-radius:8px">
      <p style="margin:0;font-size:34px;letter-spacing:0.35em;font-weight:bold;color:#c9a961;font-family:monospace">${code}</p>
    </div>
    <p style="font-size:13px;color:#4a443a;line-height:1.7">
      This code expires in <strong>15 minutes</strong>. If you didn't create an account, you can safely ignore this email.
    </p>`;

  return renderEmailLayout({
    eyebrow: 'Welcome',
    title: `Verify your email, ${name.split(' ')[0]}!`,
    bodyHtml,
  });
}

// ─── Password reset email ───────────────────────────────────────────────────

function renderResetHtml(name: string, code: string) {
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:14px;color:#4a443a;line-height:1.7">
      Hi ${name.split(' ')[0]}, we received a request to reset your password. Use this code:
    </p>
    <div style="margin:16px 0 24px;padding:20px;background:#0a0a0a;text-align:center;border-radius:8px">
      <p style="margin:0;font-size:34px;letter-spacing:0.35em;font-weight:bold;color:#c9a961;font-family:monospace">${code}</p>
    </div>
    <p style="font-size:13px;color:#4a443a;line-height:1.7">
      This code expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>`;

  return renderEmailLayout({
    eyebrow: 'Account security',
    title: 'Reset your password',
    bodyHtml,
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendOrderConfirmation(payload: OrderEmailPayload) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: payload.customerEmail,
    subject: `Order confirmed — #${String(payload.orderNumber).padStart(5, '0')}`,
    html: renderCustomerHtml(payload),
    attachments: await getLogoAttachment(),
  });
}

export async function sendShopNotification(payload: OrderEmailPayload) {
  const isSameDayOrder =
    payload.fulfilment === 'delivery' && !!payload.deliverySlot && isToday(new Date(payload.deliverySlot));
  const prefix = isSameDayOrder ? '⚡ SAME-DAY' : '🥩';
  await resend.emails.send({
    from: `Gary's Butchers Orders <${FROM}>`,
    to: ADMIN_EMAILS,
    subject: `${prefix} New order #${String(payload.orderNumber).padStart(5, '0')} — ${payload.customerName} — ${fmt(payload.totalInPence)}`,
    html: renderAdminHtml(payload),
    attachments: await getLogoAttachment(),
  });
}

export async function sendContactMessage(opts: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const bodyHtml = `
    <div style="margin-bottom:16px;padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px;font-size:14px">
      <strong>${opts.name}</strong> &lt;<a href="mailto:${opts.email}" style="color:#1a4d8f">${opts.email}</a>&gt;${opts.phone ? ' · ' + opts.phone : ''}
    </div>
    <p style="margin:0;font-size:14px;color:#1a1815;white-space:pre-wrap;line-height:1.6">${opts.message.replace(/</g, '&lt;')}</p>`;

  await resend.emails.send({
    from: `Gary's Website <${FROM}>`,
    to: ADMIN_EMAILS,
    replyTo: opts.email,
    subject: `New enquiry from ${opts.name}`,
    html: renderEmailLayout({
      eyebrow: 'Website enquiry',
      title: `New enquiry from ${opts.name}`,
      bodyHtml,
    }),
    attachments: await getLogoAttachment(),
  });
}

export async function sendContactConfirmation(opts: { name: string; message: string; email: string }) {
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;color:#4a443a;line-height:1.7">
      We've received your message and someone from the team will get back to you shortly.
    </p>
    <div style="padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px">
      <h2 style="margin:0 0 8px;font-size:12px;letter-spacing:0.15em;color:#8e7138;text-transform:uppercase">Your message</h2>
      <p style="margin:0;font-size:14px;color:#1a1815;white-space:pre-wrap;line-height:1.6">${opts.message.replace(/</g, '&lt;')}</p>
    </div>
    <p style="margin-top:24px;color:#4a443a;font-size:13px;line-height:1.7;border-top:1px solid #f0ebe3;padding-top:18px">
      In a hurry? Give us a ring and we'll help out directly.
    </p>`;

  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: opts.email,
    subject: "Thanks for your enquiry — Gary's Butchers & Fishmongers",
    html: renderEmailLayout({
      eyebrow: 'Enquiry received',
      title: `Thanks, ${opts.name.split(' ')[0]}.`,
      bodyHtml,
    }),
    attachments: await getLogoAttachment(),
  });
}

export async function sendVerificationCode(email: string, name: string, code: string) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: email,
    subject: `Your verification code: ${code}`,
    html: renderVerificationHtml(name, code),
    attachments: await getLogoAttachment(),
  });
}

export async function sendPasswordResetCode(email: string, name: string, code: string) {
  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: email,
    subject: `Password reset code: ${code}`,
    html: renderResetHtml(name, code),
    attachments: await getLogoAttachment(),
  });
}

export async function sendNewCustomerNotification(customer: {
  name: string;
  email: string;
  phone?: string | null;
}) {
  const bodyHtml = `
    <div style="padding:16px;background:#faf8f5;border:1px solid #f0ebe3;border-radius:8px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#6b5d4f;width:110px;border-bottom:1px solid #f0ebe3">Name</td>
          <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f0ebe3">${customer.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b5d4f;border-bottom:1px solid #f0ebe3">Email</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe3"><a href="mailto:${customer.email}" style="color:#1a4d8f">${customer.email}</a></td>
        </tr>
        ${customer.phone ? `<tr><td style="padding:8px 0;color:#6b5d4f;border-bottom:1px solid #f0ebe3">Phone</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f0ebe3"><a href="tel:${customer.phone}" style="color:#1a1815">${customer.phone}</a></td></tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#6b5d4f">Registered</td>
          <td style="padding:8px 0">${new Date().toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#8e7138;line-height:1.6">
      This customer has verified their email and can now place orders. View their profile in the
      <a href="${SITE_URL}/admin/customers" style="color:#1a4d8f;font-weight:600">admin dashboard</a>.
    </p>`;

  await resend.emails.send({
    from: `Gary's Butchers <${FROM}>`,
    to: ADMIN_EMAILS,
    subject: `New customer sign-up — ${customer.name}`,
    html: renderEmailLayout({
      eyebrow: 'New customer',
      title: 'New Customer Sign-Up',
      bodyHtml,
    }),
    attachments: await getLogoAttachment(),
  });
}

// ─── Admin reports ───────────────────────────────────────────────────────────

const REPORT_RECIPIENTS = [
  'gazapeline@outlook.com',
  'garysbutchers-orders@outlook.com',
  'euanmunroo@gmail.com',
];

export async function sendReportEmail(opts: {
  title: string;
  summaryHtml: string;
  filename: string;
  csvContent: string;
}) {
  await resend.emails.send({
    from: `Gary's Butchers Reports <${FROM}>`,
    to: REPORT_RECIPIENTS,
    subject: `📊 ${opts.title}`,
    html: renderEmailLayout({
      eyebrow: 'Report',
      title: opts.title,
      bodyHtml: opts.summaryHtml,
    }),
    attachments: [
      ...(await getLogoAttachment()),
      {
        filename: opts.filename,
        content: Buffer.from(opts.csvContent, 'utf-8'),
        contentType: 'text/csv',
      },
    ],
  });
}
