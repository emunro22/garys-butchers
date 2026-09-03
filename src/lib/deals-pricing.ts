export type DealForPricing = {
  id: string;
  title: string;
  dealItems: Array<{ productId: string; quantity: number }>;
  dealPrice: number | null;
};

export type CartLineForPricing = {
  productId: string;
  quantity: number;
  priceInPence: number;
};

export type AppliedDeal = {
  id: string;
  title: string;
  discountInPence: number;
  count: number;
};

// Auto-applies bundle deals based on what's already in the cart — no special
// "deal" cart line needed. `deals` must be pre-sorted (e.g. createdAt asc) —
// that order decides which deal gets first claim on a product shared by more
// than one deal, so the same units of stock never fund two bundles at once.
export function computeDealsDiscount(
  cartLines: CartLineForPricing[],
  deals: DealForPricing[]
): { totalDiscountInPence: number; applied: AppliedDeal[] } {
  const remaining = new Map<string, number>();
  const linePriceInPence = new Map<string, number>();
  for (const line of cartLines) {
    remaining.set(line.productId, (remaining.get(line.productId) ?? 0) + line.quantity);
    if (!linePriceInPence.has(line.productId)) {
      linePriceInPence.set(line.productId, line.priceInPence);
    }
  }

  const applied: AppliedDeal[] = [];
  let totalDiscountInPence = 0;

  for (const deal of deals) {
    if (deal.dealPrice == null || deal.dealItems.length === 0) continue;

    let multiplier = Infinity;
    for (const item of deal.dealItems) {
      const have = remaining.get(item.productId) ?? 0;
      multiplier = Math.min(multiplier, Math.floor(have / item.quantity));
    }
    if (!Number.isFinite(multiplier) || multiplier <= 0) continue;

    let bundleFullPrice = 0;
    for (const item of deal.dealItems) {
      bundleFullPrice += item.quantity * (linePriceInPence.get(item.productId) ?? 0);
    }

    const discountInPence = multiplier * Math.max(0, bundleFullPrice - deal.dealPrice);
    if (discountInPence <= 0) continue;

    for (const item of deal.dealItems) {
      remaining.set(item.productId, (remaining.get(item.productId) ?? 0) - multiplier * item.quantity);
    }

    totalDiscountInPence += discountInPence;
    applied.push({ id: deal.id, title: deal.title, discountInPence, count: multiplier });
  }

  return { totalDiscountInPence, applied };
}
