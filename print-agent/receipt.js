// Pure receipt-layout logic — no printer/network calls of its own. Takes a
// node-thermal-printer instance (already configured with an interface) and
// an `orders` row shape (matching src/lib/db/schema.ts on the main site) and
// just issues formatting/print-buffer calls on it. Kept separate from
// index.js so the layout can be tweaked/previewed (DRY_RUN, see index.js)
// without touching the polling loop.

const fmt = (pence) => `£${(pence / 100).toFixed(2)}`;

function formatDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
}

const FULFILMENT_LABELS = {
  pickup: 'PICKUP',
  delivery: 'DELIVERY',
  premium: 'PREMIUM / BULK DELIVERY',
};

/** Builds the full receipt onto `printer`'s buffer. Caller decides whether
 *  to printer.execute() it for real or printer.getText() it for a dry run. */
function renderReceipt(printer, order) {
  printer.alignCenter();
  printer.bold(true);
  printer.println("Gary's Butchers & Fishmongers");
  printer.bold(false);
  printer.println('19 Park Glade Shops, Erskine, PA8 7HH');
  printer.println('0141 959 0478');
  printer.newLine();

  printer.setTextQuadArea();
  printer.bold(true);
  printer.println(`ORDER #${String(order.orderNumber).padStart(5, '0')}`);
  printer.bold(false);
  printer.setTextNormal();

  const placedAt = formatDateTime(order.createdAt);
  if (placedAt) printer.println(placedAt);
  printer.drawLine();

  printer.alignLeft();
  printer.bold(true);
  printer.println(FULFILMENT_LABELS[order.fulfilment] ?? order.fulfilment.toUpperCase());
  printer.bold(false);

  const slotIso = order.fulfilment === 'pickup' ? order.pickupSlot : order.deliverySlot;
  const slot = formatDateTime(slotIso);
  if (slot) printer.println(`Slot: ${slot}`);

  if (order.fulfilment !== 'pickup' && order.deliveryAddress) {
    const a = order.deliveryAddress;
    printer.println('Deliver to:');
    printer.println(a.line1);
    if (a.line2) printer.println(a.line2);
    printer.println(`${a.city} ${a.postcode}`);
  }

  printer.newLine();
  printer.println(order.customerName);
  if (order.customerPhone) printer.println(order.customerPhone);
  printer.drawLine();

  for (const item of order.items) {
    printer.tableCustom([
      { text: `${item.quantity}x`, align: 'LEFT', width: 0.18 },
      { text: item.name, align: 'LEFT', width: 0.57 },
      { text: fmt(item.priceInPence * item.quantity), align: 'RIGHT', width: 0.25 },
    ]);
  }
  printer.drawLine();

  printer.tableCustom([
    { text: 'Subtotal', align: 'LEFT', width: 0.75 },
    { text: fmt(order.subtotalInPence), align: 'RIGHT', width: 0.25 },
  ]);
  if (order.deliveryInPence) {
    printer.tableCustom([
      { text: 'Delivery', align: 'LEFT', width: 0.75 },
      { text: fmt(order.deliveryInPence), align: 'RIGHT', width: 0.25 },
    ]);
  }
  if (order.discountInPence) {
    printer.tableCustom([
      { text: order.promotionCode ? `Discount (${order.promotionCode})` : 'Discount', align: 'LEFT', width: 0.75 },
      { text: `-${fmt(order.discountInPence)}`, align: 'RIGHT', width: 0.25 },
    ]);
  }
  printer.bold(true);
  printer.tableCustom([
    { text: 'Total', align: 'LEFT', width: 0.75 },
    { text: fmt(order.totalInPence), align: 'RIGHT', width: 0.25 },
  ]);
  printer.bold(false);

  if (order.notes) {
    printer.drawLine();
    printer.println('Notes:');
    printer.println(order.notes);
  }

  printer.drawLine();
  printer.alignCenter();
  printer.bold(true);
  printer.println("Thank you for choosing Gary's Butchers & Fishmongers!");
  printer.bold(false);
  printer.newLine();
  printer.cut();
}

module.exports = { renderReceipt };
