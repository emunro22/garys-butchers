'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Trash2, Mail, Truck, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Order } from '@/lib/db/schema';

// 'pending' (payment not yet confirmed) is deliberately excluded — those
// orders aren't real yet and are hidden from admin entirely; they either
// become 'paid' or get auto-cancelled by the expiry cron.
const STATUSES = [
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded',
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-gold-400/20 text-gold-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-ink-900 text-cream-50',
  cancelled: 'bg-butcher-500/10 text-butcher-500',
  refunded: 'bg-ink-900/5 text-ink-500',
};

const FULFILMENT_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  premium: 'Premium/Bulk',
};

type PremiumDeliveryRates = { minimumFeeInPence: number; ratePerKgInPence: number; carriers: string[] };

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<Order | null>(null);
  const [shippingTarget, setShippingTarget] = useState<Order | null>(null);
  const [premiumRates, setPremiumRates] = useState<PremiumDeliveryRates | null>(null);

  // Rate table for the premium/bulk delivery weight calculator below — admin
  // session cookie is already present on this page, so the admin-only
  // /api/settings endpoint is reachable here.
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setPremiumRates(data.settings?.premiumDelivery ?? null))
      .catch(() => {});
  }, []);

  async function saveOrderShipping(id: string, weightGrams: number | null, courierName: string | null) {
    setUpdating(id);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, weightGrams, courierName }),
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setOrders((arr) => arr.map((o) => (o.id === id ? data.order : o)));
    } catch {
      alert('Could not save weight/courier');
    } finally {
      setUpdating(null);
    }
  }

  const filtered =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteOrder(id: string, orderNumber: number | null) {
    const label = orderNumber ? `#${String(orderNumber).padStart(5, '0')}` : 'this';
    if (!confirm(`Delete order ${label}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setOrders((arr) => arr.filter((o) => o.id !== id));
    } catch {
      alert('Could not delete order');
    } finally {
      setDeleting(null);
    }
  }

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setOrders((arr) =>
        arr.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch {
      alert('Could not update order status');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs uppercase tracking-[0.18em] border ${
            filter === 'all'
              ? 'bg-ink-900 text-cream-50 border-ink-900'
              : 'border-ink-900/15 hover:border-ink-900'
          }`}
        >
          All ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.18em] border ${
                filter === s
                  ? 'bg-ink-900 text-cream-50 border-ink-900'
                  : 'border-ink-900/15 hover:border-ink-900'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-cream-100 border border-ink-900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-ink-900/10">
            <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
              <th className="px-3 py-3 w-8" />
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Slot</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-ink-500">
                  No orders match this filter.
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const isOpen = expanded.has(o.id);
              const slot = o.deliverySlot ?? o.pickupSlot;
              return (
                <Fragment key={o.id}>
                  <tr className="hover:bg-cream-50">
                    <td className="px-3 py-3 align-top">
                      <button
                        onClick={() => toggleExpand(o.id)}
                        className="p-1 hover:bg-ink-900/5"
                        aria-label="Expand order"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 tabular font-medium align-top">
                      {o.orderNumber ? `#${String(o.orderNumber).padStart(5, '0')}` : '—'}
                      <div className="text-[11px] text-ink-500 mt-0.5">
                        {new Date(o.createdAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-ink-500">{o.customerEmail}</div>
                      {o.customerPhone && (
                        <div className="text-xs text-ink-500">{o.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">{FULFILMENT_LABELS[o.fulfilment] ?? o.fulfilment}</td>
                    <td className="px-5 py-3 align-top text-ink-700">
                      {slot
                        ? new Date(slot).toLocaleString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular align-top">
                      {formatPrice(o.totalInPence)}
                    </td>
                    <td className="px-5 py-3 align-top">
                      <select
                        value={o.status}
                        disabled={updating === o.id}
                        onChange={(e) =>
                          updateStatus(o.id, e.target.value as Status)
                        }
                        className={`text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-1 border-0 cursor-pointer ${
                          STATUS_COLORS[o.status] ?? ''
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-1">
                        {o.status === 'cancelled' && (
                          <button
                            onClick={() => setEmailTarget(o)}
                            className="p-1.5 text-ink-400 hover:text-ink-900 hover:bg-ink-900/5"
                            aria-label="Email customer about cancellation"
                            title="Email customer about cancellation"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {o.fulfilment === 'premium' && (
                          <button
                            onClick={() => setShippingTarget(o)}
                            className="p-1.5 text-ink-400 hover:text-ink-900 hover:bg-ink-900/5"
                            aria-label="Send shipping update"
                            title="Send shipping update"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteOrder(o.id, o.orderNumber)}
                          disabled={deleting === o.id}
                          className="p-1.5 text-ink-400 hover:text-butcher-600 hover:bg-butcher-50 disabled:opacity-40"
                          aria-label="Delete order"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-cream-50">
                      <td colSpan={8} className="px-5 py-5">
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                          <div>
                            <p className="eyebrow text-ink-500 mb-2">Items</p>
                            <ul className="text-sm space-y-1">
                              {(o.items as any[]).map((it, i) => (
                                <li
                                  key={i}
                                  className="flex justify-between border-b border-ink-900/5 py-1.5"
                                >
                                  <span>
                                    {it.quantity} × {it.name}
                                  </span>
                                  <span className="tabular text-ink-500">
                                    {formatPrice(it.priceInPence * it.quantity)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <dl className="mt-4 space-y-1 text-sm border-t border-ink-900/10 pt-3">
                              <div className="flex justify-between">
                                <dt>Subtotal</dt>
                                <dd className="tabular">{formatPrice(o.subtotalInPence)}</dd>
                              </div>
                              {o.discountInPence > 0 && (
                                <div className="flex justify-between text-gold-700">
                                  <dt>Discount{o.promotionCode ? ` (${o.promotionCode})` : ''}</dt>
                                  <dd className="tabular">−{formatPrice(o.discountInPence)}</dd>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <dt>{o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</dt>
                                <dd className="tabular">
                                  {o.deliveryInPence === 0
                                    ? 'Free'
                                    : formatPrice(o.deliveryInPence)}
                                </dd>
                              </div>
                              <div className="flex justify-between font-medium border-t border-ink-900/10 pt-2 mt-2">
                                <dt>Total</dt>
                                <dd className="tabular">{formatPrice(o.totalInPence)}</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            {(o.fulfilment === 'delivery' || o.fulfilment === 'premium') && o.deliveryAddress && (
                              <>
                                <p className="eyebrow text-ink-500 mb-2">Delivery to</p>
                                <p className="text-sm">
                                  {(o.deliveryAddress as any).line1}
                                  {(o.deliveryAddress as any).line2 && (
                                    <>
                                      <br />
                                      {(o.deliveryAddress as any).line2}
                                    </>
                                  )}
                                  <br />
                                  {(o.deliveryAddress as any).city}
                                  <br />
                                  {(o.deliveryAddress as any).postcode}
                                </p>
                              </>
                            )}
                            {o.fulfilment === 'premium' && (
                              <div className="mt-4">
                                <PremiumDeliveryCalculator
                                  order={o}
                                  rates={premiumRates}
                                  saving={updating === o.id}
                                  onSave={(weightGrams, courierName) =>
                                    saveOrderShipping(o.id, weightGrams, courierName)
                                  }
                                />
                              </div>
                            )}
                            {o.notes && (
                              <div className="mt-4">
                                <p className="eyebrow text-ink-500 mb-2">Customer notes</p>
                                <p className="text-sm bg-cream-100 p-3 border border-ink-900/10 whitespace-pre-wrap">
                                  {o.notes}
                                </p>
                              </div>
                            )}
                            {o.stripePaymentIntentId && (
                              <div className="mt-4">
                                <p className="eyebrow text-ink-500 mb-2">Stripe</p>
                                <p className="text-xs font-mono text-ink-500 break-all">
                                  {o.stripePaymentIntentId}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {emailTarget && (
        <EmailOrderModal order={emailTarget} onClose={() => setEmailTarget(null)} />
      )}
      {shippingTarget && (
        <ShippingUpdateModal
          order={shippingTarget}
          carriers={premiumRates?.carriers ?? []}
          onClose={() => setShippingTarget(null)}
        />
      )}
    </div>
  );
}

function PremiumDeliveryCalculator({
  order,
  rates,
  saving,
  onSave,
}: {
  order: Order;
  rates: PremiumDeliveryRates | null;
  saving: boolean;
  onSave: (weightGrams: number | null, courierName: string | null) => void;
}) {
  const [weightKg, setWeightKg] = useState(
    order.weightGrams != null ? String(order.weightGrams / 1000) : ''
  );
  const [courier, setCourier] = useState(order.courierName ?? '');

  const parsedKg = parseFloat(weightKg);
  const suggestedPence =
    rates && !Number.isNaN(parsedKg) && parsedKg > 0
      ? Math.max(rates.minimumFeeInPence, Math.round(parsedKg * rates.ratePerKgInPence))
      : null;

  return (
    <div className="bg-cream-100 border border-ink-900/10 p-4 max-w-sm">
      <p className="eyebrow text-ink-500 mb-2">Weight &amp; courier calculator</p>
      <div className="flex items-end gap-2 mb-2">
        <div>
          <Label htmlFor={`weight-${order.id}`}>Weight (kg)</Label>
          <Input
            id={`weight-${order.id}`}
            type="number"
            min="0"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-24"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor={`courier-${order.id}`}>Courier</Label>
          <select
            id={`courier-${order.id}`}
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="w-full border border-ink-900/15 bg-cream-50 px-2 py-2 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
          >
            <option value="">Choose…</option>
            {(rates?.carriers ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {suggestedPence !== null && (
        <p className="text-sm text-ink-700 mb-2">
          Suggested price: <span className="font-medium">{formatPrice(suggestedPence)}</span>
        </p>
      )}
      <Button
        type="button"
        size="sm"
        onClick={() => {
          const grams = !Number.isNaN(parsedKg) && parsedKg > 0 ? Math.round(parsedKg * 1000) : null;
          onSave(grams, courier.trim() || null);
        }}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save to order'}
      </Button>
      {order.courierName && (
        <p className="text-xs text-ink-500 mt-2">
          Currently recorded: shipped via {order.courierName}
          {order.weightGrams != null ? ` · ${(order.weightGrams / 1000).toFixed(1)}kg` : ''}
        </p>
      )}
    </div>
  );
}

const SHIPPING_STATUSES = ['Preparing', 'Shipped', 'Out for delivery', 'Delivered'] as const;

function ShippingUpdateModal({
  order,
  carriers,
  onClose,
}: {
  order: Order;
  carriers: string[];
  onClose: () => void;
}) {
  const orderLabel = order.orderNumber ? `#${String(order.orderNumber).padStart(5, '0')}` : 'this order';
  const [status, setStatus] = useState<(typeof SHIPPING_STATUSES)[number]>('Shipped');
  const [courier, setCourier] = useState(order.courierName ?? carriers[0] ?? '');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const lines = [
        "Here's an update on your order.",
        '',
        `Status: ${status}`,
        courier ? `Courier: ${courier}` : null,
        trackingNumber.trim() ? `Tracking number: ${trackingNumber.trim()}` : null,
        note.trim() ? `\n${note.trim()}` : null,
      ].filter((l): l is string => l !== null);

      const res = await fetch('/api/admin/orders/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          subject: `Update on your order ${orderLabel}`,
          message: lines.join('\n'),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Could not send email');
      }
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60" onClick={onClose} aria-hidden />
      <div className="relative bg-cream-50 border border-ink-900/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <header className="p-5 border-b border-ink-900/10 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-500 mb-1">Shipping update</p>
            <h3 className="font-display text-xl text-ink-900">{order.customerName}</h3>
            <p className="text-xs text-ink-500">{order.customerEmail} · Order {orderLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 text-ink-400 hover:text-ink-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipping-status">Status</Label>
              <select
                id="shipping-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof SHIPPING_STATUSES)[number])}
                className="w-full border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
              >
                {SHIPPING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="shipping-courier">Courier</Label>
              <select
                id="shipping-courier"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
              >
                <option value="">Choose…</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="tracking-number">Tracking number</Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. JD0001234567"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="shipping-note">Additional note (optional)</Label>
            <Textarea
              id="shipping-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Anything else the customer should know"
            />
          </div>
          {error && <p className="text-sm text-butcher-500">{error}</p>}
          {sent && <p className="text-sm text-green-700">Sent!</p>}
        </div>

        <div className="p-5 border-t border-ink-900/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || sent}>
            {sending ? 'Sending…' : sent ? 'Sent' : 'Send update'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmailOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const orderLabel = order.orderNumber ? `#${String(order.orderNumber).padStart(5, '0')}` : 'this order';
  const [subject, setSubject] = useState(`About your cancelled order ${orderLabel}`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!message.trim()) {
      setError('Write a message before sending.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Could not send email');
      }
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60" onClick={onClose} aria-hidden />
      <div className="relative bg-cream-50 border border-ink-900/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <header className="p-5 border-b border-ink-900/10 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-500 mb-1">Email about cancellation</p>
            <h3 className="font-display text-xl text-ink-900">{order.customerName}</h3>
            <p className="text-xs text-ink-500">{order.customerEmail} · Order {orderLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 text-ink-400 hover:text-ink-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={5000}
              placeholder="Hi, we noticed your order was cancelled — can you let us know why? We'd love to make it right..."
              autoFocus
            />
            <p className="text-xs text-ink-400 mt-1 text-right">{message.length}/5000</p>
          </div>
          <p className="text-xs text-ink-500">
            Sent from Gary&apos;s Butchers in the same style as your order confirmation emails —
            the customer can reply directly to it.
          </p>
          {error && <p className="text-sm text-butcher-500">{error}</p>}
          {sent && <p className="text-sm text-green-700">Sent!</p>}
        </div>

        <div className="p-5 border-t border-ink-900/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || sent}>
            {sending ? 'Sending…' : sent ? 'Sent' : 'Send email'}
          </Button>
        </div>
      </div>
    </div>
  );
}
