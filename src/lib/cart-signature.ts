import { createHash } from 'crypto';

// Identifies "is this the same checkout attempt" — not just the same cart
// contents, but the same fulfilment/slot/address/promo too, so a reused
// pending order can't silently keep a stale delivery address or slot.
export function computeCartSignature(input: {
  items: Array<{
    productId: string;
    variantLabel?: string | null;
    marinadeLabel?: string | null;
    quantity: number;
    priceInPence: number;
  }>;
  total: number;
  fulfilment: 'pickup' | 'delivery' | 'premium';
  slot: string | null;
  deliveryAddress: { line1: string; line2?: string; city: string; postcode: string } | null;
  promotionCode: string | null;
}): string {
  const itemTuples = input.items
    .map((i) => [i.productId, i.variantLabel ?? '', i.marinadeLabel ?? '', i.quantity, i.priceInPence].join('::'))
    .sort();
  const raw = [
    itemTuples.join('|'),
    input.total,
    input.fulfilment,
    input.slot ?? '',
    JSON.stringify(input.deliveryAddress ?? null),
    input.promotionCode ?? '',
  ].join('||');
  return createHash('sha256').update(raw).digest('hex');
}
