import { ordersDb } from '@/lib/db';
import { users, orders } from '@/lib/db/schema';
import { ensureUsersSchema, ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { gte, and, notInArray } from 'drizzle-orm';
import { toCsv } from '@/lib/csv';
import { activeOrderFilter } from '@/lib/order-status';
import { getDateKey } from '@/lib/slots';
import { getDistanceMiles } from '@/lib/utils';

type OrderRow = typeof orders.$inferSelect;

function cutoffDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function periodLabel(days: number, since: Date): string {
  return `Last ${days} day${days === 1 ? '' : 's'} (since ${since.toLocaleDateString('en-GB')})`;
}

export async function buildSignupsReport(days: number) {
  const since = cutoffDate(days);
  await ensureUsersSchema();
  const rows = await ordersDb.select().from(users).where(gte(users.createdAt, since));
  const sorted = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const csvRows: Array<Array<string | number>> = [
    ['Report', 'New customer sign-ups'],
    ['Period', periodLabel(days, since)],
    ['Total sign-ups', sorted.length],
    [],
    ['Name', 'Email', 'Phone', 'Verified', 'Signed up'],
    ...sorted.map((u) => [
      u.name,
      u.email,
      u.phone ?? '',
      u.emailVerified ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleString('en-GB', { timeZone: 'Europe/London' }),
    ]),
  ];

  return {
    csv: toCsv(csvRows),
    total: sorted.length,
    filename: `signups-last-${days}-days.csv`,
  };
}

export async function buildProductSalesReport(days: number) {
  const since = cutoffDate(days);
  const rows = await ordersDb
    .select({ items: orders.items })
    .from(orders)
    .where(and(gte(orders.createdAt, since), notInArray(orders.status, ['pending', 'cancelled', 'refunded'])));

  const totals = new Map<string, { name: string; quantity: number; revenueInPence: number }>();
  for (const row of rows) {
    for (const item of row.items) {
      const existing = totals.get(item.name) ?? { name: item.name, quantity: 0, revenueInPence: 0 };
      existing.quantity += item.quantity;
      existing.revenueInPence += item.quantity * item.priceInPence;
      totals.set(item.name, existing);
    }
  }
  const sorted = [...totals.values()].sort((a, b) => b.quantity - a.quantity);

  const csvRows: Array<Array<string | number>> = [
    ['Report', 'Product sales'],
    ['Period', periodLabel(days, since)],
    ['Total paid orders', rows.length],
    [],
    ['Product', 'Quantity sold', 'Revenue (£)'],
    ...sorted.map((p) => [p.name, p.quantity, (p.revenueInPence / 100).toFixed(2)]),
  ];

  return {
    csv: toCsv(csvRows),
    totalOrders: rows.length,
    totalProducts: sorted.length,
    filename: `product-sales-last-${days}-days.csv`,
  };
}

function timeLabel(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemsSummary(items: OrderRow['items']): string {
  return items.map((i) => `${i.quantity}x ${i.name}`).join('; ');
}

function orderLabel(o: OrderRow): string {
  return o.orderNumber ? `#${String(o.orderNumber).padStart(5, '0')}` : o.id;
}

/** True if this delivery order was placed the same calendar day it's due —
 *  same definition of "same-day" as checkout's isSameDaySlot check, but
 *  read straight off the persisted dates instead of the (mutable) shop
 *  settings, so it stays accurate for historical orders. */
function isSameDayDelivery(o: OrderRow): boolean {
  return o.fulfilment === 'delivery' && !!o.deliverySlot && getDateKey(o.deliverySlot) === getDateKey(o.createdAt);
}

/** Sorts delivery orders (regular or same-day) by timeslot, then postcode,
 *  then driving distance from the shop — the order a driver would want to
 *  work through a run in. */
function sortDeliveryOrders(list: OrderRow[], distanceByPostcode: Map<string, number | null>): OrderRow[] {
  return [...list].sort((a, b) => {
    const slotA = a.deliverySlot ? +new Date(a.deliverySlot) : Infinity;
    const slotB = b.deliverySlot ? +new Date(b.deliverySlot) : Infinity;
    if (slotA !== slotB) return slotA - slotB;
    const pcA = a.deliveryAddress?.postcode ?? '';
    const pcB = b.deliveryAddress?.postcode ?? '';
    if (pcA !== pcB) return pcA.localeCompare(pcB);
    const distA = distanceByPostcode.get(pcA) ?? Infinity;
    const distB = distanceByPostcode.get(pcB) ?? Infinity;
    return (distA ?? Infinity) - (distB ?? Infinity);
  });
}

function deliveryRows(list: OrderRow[], distanceByPostcode: Map<string, number | null>): Array<Array<string | number>> {
  return list.map((o) => {
    const addr = o.deliveryAddress;
    const distance = addr?.postcode ? distanceByPostcode.get(addr.postcode) : null;
    return [
      orderLabel(o),
      o.customerName,
      o.customerPhone ?? '',
      timeLabel(o.deliverySlot),
      addr ? [addr.line1, addr.line2, addr.city].filter(Boolean).join(', ') : '',
      addr?.postcode ?? '',
      distance != null ? distance.toFixed(1) : '',
      itemsSummary(o.items),
      (o.totalInPence / 100).toFixed(2),
    ];
  });
}

/**
 * Operational "what's happening" report for the selected period — every
 * real (non-pending/cancelled/refunded) order, grouped by how it's
 * fulfilled and sorted the way whoever's running that day would want to
 * work through it: pickups by timeslot, deliveries and same-day deliveries
 * each by timeslot then postcode then distance from the shop (a rough
 * driving-route order), and premium/bulk orders (no shop timeslot) by
 * order date.
 */
export async function buildOrdersScheduleReport(days: number) {
  const since = cutoffDate(days);
  await ensureOrdersSchema();
  const rows = await ordersDb
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, since), activeOrderFilter()));

  const pickup = rows.filter((o) => o.fulfilment === 'pickup');
  const premium = rows.filter((o) => o.fulfilment === 'premium');
  const deliveryAll = rows.filter((o) => o.fulfilment === 'delivery');
  const sameDay = deliveryAll.filter(isSameDayDelivery);
  const sameDayIds = new Set(sameDay.map((o) => o.id));
  const regularDelivery = deliveryAll.filter((o) => !sameDayIds.has(o.id));

  // Look up each distinct postcode's distance from the shop once, in
  // parallel, rather than once per order — most deliveries on a given day
  // cluster into a handful of postcodes.
  const uniquePostcodes = [
    ...new Set([...regularDelivery, ...sameDay].map((o) => o.deliveryAddress?.postcode).filter((p): p is string => !!p)),
  ];
  const distanceEntries = await Promise.all(
    uniquePostcodes.map(async (pc) => [pc, await getDistanceMiles(pc)] as const)
  );
  const distanceByPostcode = new Map(distanceEntries);

  const sortedPickup = [...pickup].sort(
    (a, b) => (a.pickupSlot ? +new Date(a.pickupSlot) : Infinity) - (b.pickupSlot ? +new Date(b.pickupSlot) : Infinity)
  );
  const sortedRegularDelivery = sortDeliveryOrders(regularDelivery, distanceByPostcode);
  const sortedSameDay = sortDeliveryOrders(sameDay, distanceByPostcode);
  const sortedPremium = [...premium].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const csvRows: Array<Array<string | number>> = [
    ['Report', 'Orders schedule'],
    ['Period', periodLabel(days, since)],
    ['Total orders', rows.length],
    [],
    [`Pickup orders (${sortedPickup.length}): sorted by pickup time`],
    ['Order #', 'Customer', 'Phone', 'Pickup time', 'Items', 'Total (£)'],
    ...sortedPickup.map((o) => [
      orderLabel(o),
      o.customerName,
      o.customerPhone ?? '',
      timeLabel(o.pickupSlot),
      itemsSummary(o.items),
      (o.totalInPence / 100).toFixed(2),
    ]),
    [],
    [`Delivery orders (${sortedRegularDelivery.length}): sorted by delivery time, postcode, distance from shop`],
    ['Order #', 'Customer', 'Phone', 'Delivery time', 'Address', 'Postcode', 'Distance from shop (miles)', 'Items', 'Total (£)'],
    ...deliveryRows(sortedRegularDelivery, distanceByPostcode),
    [],
    [`Same-day delivery orders (${sortedSameDay.length}): sorted by delivery time, postcode, distance from shop`],
    ['Order #', 'Customer', 'Phone', 'Delivery time', 'Address', 'Postcode', 'Distance from shop (miles)', 'Items', 'Total (£)'],
    ...deliveryRows(sortedSameDay, distanceByPostcode),
    [],
    [`Premium/bulk delivery orders (${sortedPremium.length}): sorted by order date`],
    ['Order #', 'Customer', 'Phone', 'Address', 'Postcode', 'Weight', 'Courier', 'Items', 'Total (£)'],
    ...sortedPremium.map((o) => [
      orderLabel(o),
      o.customerName,
      o.customerPhone ?? '',
      o.deliveryAddress ? [o.deliveryAddress.line1, o.deliveryAddress.line2, o.deliveryAddress.city].filter(Boolean).join(', ') : '',
      o.deliveryAddress?.postcode ?? '',
      o.weightGrams ? `${(o.weightGrams / 1000).toFixed(2)}kg` : '',
      o.courierName ?? '',
      itemsSummary(o.items),
      (o.totalInPence / 100).toFixed(2),
    ]),
  ];

  return {
    csv: toCsv(csvRows),
    total: rows.length,
    filename: `orders-schedule-last-${days}-days.csv`,
  };
}
