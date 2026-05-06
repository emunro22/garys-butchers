'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/db/schema';

const STATUSES = [
  'pending',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded',
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-cream-200 text-ink-700',
  paid: 'bg-gold-400/20 text-gold-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-ink-900 text-cream-50',
  cancelled: 'bg-butcher-500/10 text-butcher-500',
  refunded: 'bg-ink-900/5 text-ink-500',
};

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);

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
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
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
                      #{String(o.orderNumber).padStart(5, '0')}
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
                    <td className="px-5 py-3 capitalize align-top">{o.fulfilment}</td>
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
                  </tr>
                  {isOpen && (
                    <tr className="bg-cream-50">
                      <td colSpan={7} className="px-5 py-5">
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
                            {o.fulfilment === 'delivery' && o.deliveryAddress && (
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
    </div>
  );
}
