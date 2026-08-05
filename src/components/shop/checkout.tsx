'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCart, cartSubtotal, cartKey } from '@/lib/cart';
import { formatPrice, calculateDelivery, MINIMUM_DELIVERY_ORDER_PENCE } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Truck, Store, Zap, Tag, Check, Package, Gift } from 'lucide-react';
import { useCustomerSession } from '@/components/account/session-provider';
import { generateSlots, generateTodaySlots, getDateKey, bucketKey, blockLabel, formatClock, type SlotGroupSettings } from '@/lib/slots';
import { noticeLabel } from '@/lib/notice';

// ---- Stripe loader ----
let stripePromise: Promise<StripeJS | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

type Fulfilment = 'pickup' | 'delivery' | 'sameDay' | 'premium';

type PremiumDeliverySettings = {
  enabled: boolean;
  minimumFeeInPence: number;
  ratePerKgInPence: number;
  carriers: string[];
  description: string;
};

type Promo = {
  id: string;
  code: string;
  type: 'percent_off' | 'amount_off' | 'free_delivery';
  value: number;
  description?: string | null;
  // Set when this code only applies to one product — the basket must
  // contain it, and the discount is calculated on just that product's line.
  productId?: string | null;
  productName?: string | null;
} | null;

export function Checkout() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { user } = useCustomerSession();

  const [fulfilment, setFulfilment] = useState<Fulfilment>('delivery');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: 'Erskine',
    postcode: '',
    slot: '',
    notes: '',
  });
  const [prefilled, setPrefilled] = useState(false);

  // Premium/bulk delivery is only offered to registered customers the admin
  // has explicitly flagged — derived from the profile fetch below, so it's
  // false by construction for guests (that fetch never runs without a session).
  const [premiumEligible, setPremiumEligible] = useState(false);
  const [premiumSettings, setPremiumSettings] = useState<PremiumDeliverySettings | null>(null);

  useEffect(() => {
    fetch('/api/premium-delivery')
      .then((r) => r.json())
      .then((data) => setPremiumSettings(data.premiumDelivery ?? null))
      .catch(() => {});
  }, []);

  const [sameDayFeeSettings, setSameDayFeeSettings] = useState<{ enabled: boolean; feeInPence: number } | null>(null);

  useEffect(() => {
    fetch('/api/same-day-fee')
      .then((r) => r.json())
      .then((data) => setSameDayFeeSettings(data.sameDayFee ?? null))
      .catch(() => {});
  }, []);

  // Referral reward: auto-applied (no code to enter) for a logged-in customer
  // sitting on an unspent credit — see the profile fetch below for the actual
  // eligibility flag. The real charge is always computed server-side in
  // /api/checkout; this is only used to show an accurate total up front.
  const [referralSettings, setReferralSettings] = useState<{ enabled: boolean; rewardPercent: number } | null>(null);
  const [referralCreditsAvailable, setReferralCreditsAvailable] = useState(0);

  useEffect(() => {
    fetch('/api/referral-settings')
      .then((r) => r.json())
      .then((data) => setReferralSettings(data.referrals ?? null))
      .catch(() => {});
  }, []);

  // Auto-fill form from logged-in user's profile
  useEffect(() => {
    if (!user || prefilled) return;
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setForm((prev) => ({
            ...prev,
            name: prev.name || p.name || '',
            email: prev.email || p.email || '',
            phone: prev.phone || p.phone || '',
            line1: prev.line1 || p.defaultAddress?.line1 || '',
            line2: prev.line2 || p.defaultAddress?.line2 || '',
            city: prev.city || p.defaultAddress?.city || 'Erskine',
            postcode: prev.postcode || p.defaultAddress?.postcode || '',
          }));
          setPremiumEligible(Boolean(p.premiumDeliveryEligible));
          setReferralCreditsAvailable(Number(p.referralCreditsAvailable) || 0);
          setPrefilled(true);
        }
      })
      .catch(() => {});
  }, [user, prefilled]);

  // If the customer signs out mid-checkout, immediately drop premium
  // eligibility rather than leaving the last-known (stale) flag in place.
  useEffect(() => {
    if (!user) {
      setPremiumEligible(false);
      setReferralCreditsAvailable(0);
    }
  }, [user]);

  const showPremiumOption = premiumEligible && Boolean(premiumSettings?.enabled);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<Promo>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const belowDeliveryMinimum = fulfilment !== 'pickup' && subtotal < MINIMUM_DELIVERY_ORDER_PENCE;

  const [postcodeFeePence, setPostcodeFeePence] = useState<number | null>(null);
  const [postcodeFeePending, setPostcodeFeePending] = useState(false);
  const [withinRadius, setWithinRadius] = useState(true);
  const [postcodeUnverifiable, setPostcodeUnverifiable] = useState(false);

  useEffect(() => {
    if (fulfilment === 'pickup' || fulfilment === 'premium' || form.postcode.replace(/\s/g, '').length < 5) {
      setPostcodeFeePence(null);
      setWithinRadius(true);
      setPostcodeUnverifiable(false);
      return;
    }
    setPostcodeFeePending(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/delivery-fee?postcode=${encodeURIComponent(form.postcode)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPostcodeFeePence(data.feePence);
          setWithinRadius(data.withinRadius ?? true);
          setPostcodeUnverifiable(data.withinRadius === false && data.distanceMiles === null);
        }
      } finally {
        setPostcodeFeePending(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.postcode, subtotal, fulfilment]);

  const baseDeliveryFee =
    fulfilment === 'pickup'
      ? 0
      : fulfilment === 'premium'
      ? premiumSettings?.minimumFeeInPence ?? 2000
      : postcodeFeePence !== null
      ? postcodeFeePence
      : calculateDelivery('delivery');

  // Same-day is still the normal local, distance-priced delivery — this is
  // just an extra rush-service surcharge on top, mirrored authoritatively
  // in /api/checkout.
  const sameDaySurcharge =
    fulfilment === 'sameDay' && sameDayFeeSettings?.enabled ? sameDayFeeSettings.feeInPence : 0;
  const deliveryFee = baseDeliveryFee + sameDaySurcharge;

  // Meat packs are already bundled/discounted pricing — promo codes apply
  // only to the non-pack portion of the order, mirrored server-side in
  // /api/checkout (the actual charge is always computed there, not here).
  const discountableSubtotal = useMemo(
    () => items.reduce((sum, i) => (i.isPack ? sum : sum + i.priceInPence * i.quantity), 0),
    [items]
  );

  // A product-targeted code only discounts that product's own line total —
  // 0 if it's no longer in the basket, in which case the code silently
  // stops applying rather than blocking checkout.
  const promoTargetSubtotal = useMemo(() => {
    if (!promo?.productId) return null;
    return items.reduce(
      (sum, i) => (i.productId === promo.productId ? sum + i.priceInPence * i.quantity : sum),
      0
    );
  }, [items, promo]);

  const referralCreditApplies =
    referralCreditsAvailable > 0 && Boolean(referralSettings?.enabled);

  const totals = useMemo(() => {
    let discount = 0;
    let dFee = deliveryFee;
    if (promo) {
      const applicableSubtotal = promo.productId ? (promoTargetSubtotal ?? 0) : discountableSubtotal;
      if (promo.type === 'percent_off') {
        discount = Math.round((applicableSubtotal * promo.value) / 100);
      } else if (promo.type === 'amount_off') {
        discount = Math.min(promo.value, applicableSubtotal);
      } else if (promo.type === 'free_delivery') {
        dFee = 0;
      }
    }
    if (referralCreditApplies && referralSettings) {
      const remaining = Math.max(0, discountableSubtotal - discount);
      const referralDiscount = Math.round((discountableSubtotal * referralSettings.rewardPercent) / 100);
      discount += Math.min(referralDiscount, remaining);
    }
    const total = Math.max(0, subtotal - discount) + dFee;
    return { discount, deliveryFee: dFee, total };
  }, [subtotal, discountableSubtotal, promoTargetSubtotal, deliveryFee, promo, referralCreditApplies, referralSettings]);

  // Slot block definitions (times, capacity, closed days) are admin-configurable —
  // fetched per fulfilment type below, alongside live booked/capacity counts.
  const [deliveryGroup, setDeliveryGroup] = useState<SlotGroupSettings | null>(null);
  const [sameDayGroup, setSameDayGroup] = useState<SlotGroupSettings | null>(null);
  const [pickupGroup, setPickupGroup] = useState<SlotGroupSettings | null>(null);

  // Pickup: next 7 eligible days, admin-configured blocks.
  const pickupSlots = useMemo(() => (pickupGroup ? generateSlots(pickupGroup, 7) : []), [pickupGroup]);

  // Delivery: next 7 eligible days, admin-configured blocks. Once today's
  // next-day cutoff has passed, deliveryCutoffNoticeDays (from the
  // availability fetch below) pushes the earliest day out by one.
  const [deliveryCutoffNoticeDays, setDeliveryCutoffNoticeDays] = useState(0);
  const deliverySlots = useMemo(
    () => (deliveryGroup ? generateSlots(deliveryGroup, 7, deliveryCutoffNoticeDays) : []),
    [deliveryGroup, deliveryCutoffNoticeDays]
  );

  // Same-day: today only, still-open admin-configured blocks. There's a single
  // window (no picking between multiple slots) — the whole point of same-day
  // is "order now, it arrives in this window", not a scheduling choice.
  const sameDaySlotsList = useMemo(() => (sameDayGroup ? generateTodaySlots(sameDayGroup) : []), [sameDayGroup]);
  const sameDaySlot = sameDaySlotsList[0] ?? null;

  // Same-day slot availability — fetched unconditionally on mount, not gated on
  // fulfilment === 'sameDay'. The "Same-day delivery" button's disabled state
  // depends on this data (whether the window is still open / already full
  // today), so gating the fetch behind already being in same-day mode meant
  // the button could never be clicked once disabled: no data in, no way to
  // enable it.
  const [sameDayAvailability, setSameDayAvailability] = useState<Record<string, { count: number; capacity: number }>>({});

  useEffect(() => {
    fetch('/api/same-day-availability')
      .then((r) => r.json())
      .then((data) => {
        setSameDayAvailability(data.availability ?? {});
        setSameDayGroup(data.group ?? null);
      })
      .catch(() => {});
  }, []);

  function isSameDaySlotFull(s: { blockId?: string } | null) {
    if (!s?.blockId) return false;
    const info = sameDayAvailability[s.blockId];
    if (!info) return false;
    return info.count >= info.capacity;
  }

  const sameDaySlotFull = isSameDaySlotFull(sameDaySlot);

  const slots =
    fulfilment === 'delivery'
      ? deliverySlots
      : fulfilment === 'sameDay'
      ? sameDaySlotsList
      : fulfilment === 'premium'
      ? []
      : pickupSlots;

  // Earliest allowed date given the most demanding notice period among cart items.
  const maxNoticeDays = useMemo(
    () => items.reduce((max, i) => Math.max(max, i.noticeDays ?? 0), 0),
    [items]
  );
  const sameDayEligible = maxNoticeDays === 0;
  const sameDayDisabledReason =
    !sameDayEligible
      ? 'An item in your basket needs advance notice'
      : sameDayGroup === null
      ? 'Checking today’s availability…'
      : sameDaySlotsList.length === 0
      ? 'Same-day delivery has finished for today'
      : sameDaySlotFull
      ? 'Same-day delivery is fully booked for today'
      : null;
  // A single window, e.g. "5pm and 8pm" — same-day is "order now, it arrives
  // in this window today", not a slot the customer picks between.
  const sameDayBlock = sameDayGroup?.blocks[0] ?? null;
  const sameDayWindowText = sameDayBlock
    ? `between ${formatClock(sameDayBlock.startMinutes)} and ${formatClock(sameDayBlock.endMinutes)}`
    : null;
  const sameDayFeeSuffix =
    sameDayFeeSettings?.enabled && sameDayFeeSettings.feeInPence > 0
      ? ` · +${formatPrice(sameDayFeeSettings.feeInPence)}`
      : '';
  const sameDaySubtitle = sameDayBlock
    ? `Delivered today, ${blockLabel(sameDayBlock)}${sameDayFeeSuffix}`
    : `Today${sameDayFeeSuffix}`;

  const earliestSlotDateKey = slots[0]?.dateKey;
  const minAllowedDateKey = useMemo(() => {
    if (maxNoticeDays === 0 || !earliestSlotDateKey) return earliestSlotDateKey;
    // earliestSlotDateKey is already "today + 1" (generateSlots' baseline), and
    // noticeDays is an absolute day count from today (1 = next day, 2 = two
    // days out, ...), so only the notice beyond that baseline gets added here.
    const d = new Date(`${earliestSlotDateKey}T00:00:00`);
    d.setDate(d.getDate() + maxNoticeDays - 1);
    return getDateKey(d);
  }, [maxNoticeDays, earliestSlotDateKey]);

  function isSlotTooSoon(s: { dateKey?: string }) {
    if (fulfilment === 'sameDay') return false; // same-day mode is only reachable when notice-eligible
    if (!s.dateKey || !minAllowedDateKey) return false;
    return s.dateKey < minAllowedDateKey;
  }

  // Clear the chosen slot if it's no longer valid for the current fulfilment type or notice period.
  useEffect(() => {
    const current = slots.find((s) => s.value === form.slot);
    if (form.slot && (!current || isSlotTooSoon(current))) {
      setForm((prev) => ({ ...prev, slot: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfilment, minAllowedDateKey]);

  // Drop out of same-day mode automatically if the basket stops qualifying.
  useEffect(() => {
    if (fulfilment === 'sameDay' && sameDayDisabledReason) {
      setFulfilment('delivery');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameDayDisabledReason]);

  // Drop out of premium mode automatically if it stops being available
  // (e.g. the customer signs out mid-checkout).
  useEffect(() => {
    if (fulfilment === 'premium' && !showPremiumOption) {
      setFulfilment('delivery');
    }
  }, [fulfilment, showPremiumOption]);

  // Delivery slot availability (only relevant for delivery)
  const [availability, setAvailability] = useState<Record<string, { count: number; capacity: number }>>({});

  useEffect(() => {
    if (fulfilment !== 'delivery') return;
    fetch('/api/delivery-availability')
      .then((r) => r.json())
      .then((data) => {
        setAvailability(data.availability ?? {});
        setDeliveryGroup(data.group ?? null);
        setDeliveryCutoffNoticeDays(data.minNoticeDays ?? 0);
      })
      .catch(() => {});
  }, [fulfilment]);

  function isSlotFull(s: { blockId?: string; dateKey?: string }) {
    if (!s.blockId || !s.dateKey) return false;
    const info = availability[bucketKey(s.dateKey, s.blockId)];
    if (!info) return false;
    return info.count >= info.capacity;
  }

  // Pickup slot availability (only relevant for pickup)
  const [pickupAvailability, setPickupAvailability] = useState<Record<string, { count: number; capacity: number }>>({});

  useEffect(() => {
    if (fulfilment !== 'pickup') return;
    fetch('/api/pickup-availability')
      .then((r) => r.json())
      .then((data) => {
        setPickupAvailability(data.availability ?? {});
        setPickupGroup(data.group ?? null);
      })
      .catch(() => {});
  }, [fulfilment]);

  function isPickupSlotFull(s: { blockId?: string; dateKey?: string }) {
    if (!s.blockId || !s.dateKey) return false;
    const info = pickupAvailability[bucketKey(s.dateKey, s.blockId)];
    if (!info) return false;
    return info.count >= info.capacity;
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setApplying(true);
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          subtotalInPence: subtotal,
          items: items.map((i) => ({ productId: i.productId })),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? 'Code not valid');
        setPromo(null);
      } else {
        setPromo(data.promotion);
      }
    } catch {
      setPromoError('Could not check that code');
    } finally {
      setApplying(false);
    }
  }

  function clearPromo() {
    setPromo(null);
    setPromoCode('');
    setPromoError(null);
  }

  function validate(): string | null {
    if (items.length === 0) return 'Your basket is empty.';
    if (!form.name) return 'Please enter your name.';
    if (!form.email) return 'Please enter your email.';
    if (!form.phone) return 'Please enter a phone number.';
    if (fulfilment !== 'premium') {
      if (!form.slot) return 'Please choose a time slot.';
      const chosenSlot = slots.find((s) => s.value === form.slot);
      if (chosenSlot && isSlotTooSoon(chosenSlot)) {
        return `That slot doesn't meet the ${noticeLabel(maxNoticeDays).toLowerCase()} for an item in your basket.`;
      }
    }
    if (fulfilment !== 'pickup') {
      if (belowDeliveryMinimum) {
        return `Sorry, there's a ${formatPrice(MINIMUM_DELIVERY_ORDER_PENCE)} minimum order for delivery — please add more items, or choose pickup instead.`;
      }
      if (!form.line1) return 'Please enter your delivery address.';
      if (!form.postcode) return 'Please enter your postcode.';
      if (!withinRadius) return "Sorry, that address is outside our 30 mile delivery area — please choose pickup instead.";
    }
    return null;
  }

  async function handleProceed() {
    const err = validate();
    if (err) {
      setCreateError(err);
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          fulfilment: fulfilment === 'pickup' ? 'pickup' : fulfilment === 'premium' ? 'premium' : 'delivery',
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          deliveryAddress:
            fulfilment !== 'pickup'
              ? {
                  line1: form.line1,
                  line2: form.line2 || undefined,
                  city: form.city,
                  postcode: form.postcode,
                }
              : null,
          slot: form.slot || undefined,
          notes: form.notes || undefined,
          promotionCode: promo?.code,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setCreateError(
          data?.error ?? 'Sorry, something went wrong starting checkout. Please try again.'
        );
        return;
      }
      if (!data.clientSecret) {
        // Fully covered by a promo code — nothing to pay, order is already confirmed.
        clear();
        router.push(`/checkout/success?order=${data.orderId}`);
        return;
      }
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (e) {
      // Network failure or unexpected client-side error — never show raw detail.
      console.error('checkout submit error', e);
      setCreateError('Sorry, something went wrong starting checkout. Please check your connection and try again.');
    } finally {
      setCreating(false);
    }
  }

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-3xl text-ink-900">Your basket is empty.</p>
        <Link href="/shop" className="inline-block mt-6">
          <Button variant="primary">Back to shop</Button>
        </Link>
      </div>
    );
  }

  // Once clientSecret exists, render Stripe Elements
  if (clientSecret) {
    return (
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0a0a0a',
              colorBackground: '#ffffff',
              colorText: '#0a0a0a',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              borderRadius: '0px',
            },
          },
        }}
      >
        <PaymentForm
          orderId={orderId!}
          totalInPence={totals.total}
          onSuccess={() => {
            clear();
            router.push(`/checkout/success?order=${orderId}`);
          }}
        />
      </Elements>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-10">
      {/* Left: form */}
      <div className="space-y-10">
        {/* Fulfilment */}
        <section>
          <h2 className="font-display text-2xl text-ink-900 mb-4">1. Delivery or pickup</h2>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              showPremiumOption ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            } gap-3`}
          >
            <button
              type="button"
              disabled={!!sameDayDisabledReason}
              onClick={() => {
                if (sameDayDisabledReason) return;
                setFulfilment('sameDay');
                if (sameDaySlot) setForm((prev) => ({ ...prev, slot: sameDaySlot.value }));
              }}
              className={`p-5 border text-left transition-all ${
                sameDayDisabledReason
                  ? 'border-ink-900/10 bg-cream-100/50 text-ink-400 cursor-not-allowed'
                  : fulfilment === 'sameDay'
                  ? 'border-ink-900 bg-ink-900 text-cream-50'
                  : 'border-ink-900/15 bg-cream-100 hover:border-ink-900/40'
              }`}
            >
              <Zap className="h-6 w-6 mb-3" />
              <p className="font-display text-lg">Same-day delivery</p>
              <p className="text-xs opacity-70 mt-1">
                {sameDayDisabledReason ?? sameDaySubtitle}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFulfilment('delivery')}
              className={`p-5 border text-left transition-all ${
                fulfilment === 'delivery'
                  ? 'border-ink-900 bg-ink-900 text-cream-50'
                  : 'border-ink-900/15 bg-cream-100 hover:border-ink-900/40'
              }`}
            >
              <Truck className="h-6 w-6 mb-3" />
              <p className="font-display text-lg">Home delivery</p>
              <p className="text-xs opacity-70 mt-1">
                £25 minimum order · free delivery within 5 miles
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFulfilment('pickup')}
              className={`p-5 border text-left transition-all ${
                fulfilment === 'pickup'
                  ? 'border-ink-900 bg-ink-900 text-cream-50'
                  : 'border-ink-900/15 bg-cream-100 hover:border-ink-900/40'
              }`}
            >
              <Store className="h-6 w-6 mb-3" />
              <p className="font-display text-lg">Click &amp; collect</p>
              <p className="text-xs opacity-70 mt-1">From our Erskine shop · free</p>
            </button>
            {showPremiumOption && (
              <button
                type="button"
                onClick={() => setFulfilment('premium')}
                className={`p-5 border text-left transition-all ${
                  fulfilment === 'premium'
                    ? 'border-ink-900 bg-ink-900 text-cream-50'
                    : 'border-ink-900/15 bg-cream-100 hover:border-ink-900/40'
                }`}
              >
                <Package className="h-6 w-6 mb-3" />
                <p className="font-display text-lg">Premium / bulk delivery</p>
                <p className="text-xs opacity-70 mt-1">
                  From {formatPrice(premiumSettings?.minimumFeeInPence ?? 2000)}
                </p>
              </button>
            )}
          </div>
        </section>

        {belowDeliveryMinimum && (
          <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
            There&apos;s a {formatPrice(MINIMUM_DELIVERY_ORDER_PENCE)} minimum order for delivery — you&apos;re{' '}
            {formatPrice(MINIMUM_DELIVERY_ORDER_PENCE - subtotal)} away, or{' '}
            <button
              type="button"
              onClick={() => setFulfilment('pickup')}
              className="underline font-medium"
            >
              choose click &amp; collect
            </button>{' '}
            instead.
          </p>
        )}

        {/* Contact details */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl text-ink-900">2. Your details</h2>
            {!user && (
              <Link
                href="/account/login?next=/checkout"
                className="text-xs uppercase tracking-[0.15em] text-ink-500 hover:text-ink-900 underline"
              >
                Already have an account? Sign in
              </Link>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
                required
              />
            </div>
          </div>
        </section>

        {/* Address (delivery / same-day only) */}
        {fulfilment !== 'pickup' && (
          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-4">3. Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Address line 1</Label>
                <Input
                  id="line1"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line2">Address line 2 (optional)</Label>
                <Input
                  id="line2"
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">Town / city</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={form.postcode}
                  onChange={(e) =>
                    setForm({ ...form, postcode: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>
              {!postcodeFeePending && !withinRadius && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
                    {postcodeUnverifiable ? (
                      <>Sorry — we couldn&apos;t verify that postcode. Please double-check it, or choose{' '}</>
                    ) : (
                      <>Sorry — that&apos;s outside our 30 mile delivery area. Please choose{' '}</>
                    )}
                    <button
                      type="button"
                      onClick={() => setFulfilment('pickup')}
                      className="underline font-medium"
                    >
                      click &amp; collect
                    </button>{' '}
                    instead.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Slot */}
        <section>
          <h2 className="font-display text-2xl text-ink-900 mb-4">
            {fulfilment === 'pickup'
              ? '3. Pickup slot'
              : fulfilment === 'sameDay'
              ? '4. Same-day delivery'
              : fulfilment === 'premium'
              ? '4. Delivery details'
              : '4. Delivery slot'}
          </h2>
          {maxNoticeDays > 0 && fulfilment !== 'sameDay' && fulfilment !== 'premium' && (
            <p className="text-xs text-butcher-500 mb-3">
              Your basket includes an item that needs {noticeLabel(maxNoticeDays).toLowerCase()} — earlier slots are unavailable.
            </p>
          )}
          {fulfilment === 'delivery' && deliveryCutoffNoticeDays > 0 && (
            <p className="text-xs text-butcher-500 mb-3">
              Today&apos;s next-day delivery cutoff has passed — the earliest delivery is now the day after tomorrow.
            </p>
          )}
          {fulfilment === 'sameDay' ? (
            <p className="flex items-start gap-3 text-sm border border-ink-900/15 bg-cream-100 px-4 py-3 text-ink-700">
              <Zap className="h-4 w-4 mt-0.5 shrink-0 text-gold-500" />
              <span>
                All same-day delivery orders are delivered today
                {sameDayWindowText ? `, ${sameDayWindowText}` : ''} — no need to pick a time.
              </span>
            </p>
          ) : fulfilment === 'premium' ? (
            <p className="flex items-start gap-3 text-sm border border-ink-900/15 bg-cream-100 px-4 py-3 text-ink-700">
              <Package className="h-4 w-4 mt-0.5 shrink-0 text-gold-500" />
              <span>
                {premiumSettings?.description ??
                  "For bulk orders and deliveries outside our usual area — we'll confirm the exact price and courier once your order is weighed."}
                {premiumSettings?.carriers?.length ? ` Courier: ${premiumSettings.carriers.join(' / ')}.` : ''}{' '}
                Minimum {formatPrice(premiumSettings?.minimumFeeInPence ?? 2000)} — no need to pick a delivery time,
                we&apos;ll be in touch to arrange it.
              </span>
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {slots.map((s) => {
                const full = fulfilment === 'pickup' ? isPickupSlotFull(s) : isSlotFull(s);
                const tooSoon = !full && isSlotTooSoon(s);
                const disabled = full || tooSoon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setForm({ ...form, slot: s.value })}
                    className={`px-3 py-3 text-xs uppercase tracking-[0.18em] border transition-colors ${
                      disabled
                        ? 'bg-cream-100 border-ink-900/10 text-ink-400 cursor-not-allowed'
                        : form.slot === s.value
                        ? 'bg-ink-900 text-cream-50 border-ink-900'
                        : 'bg-cream-100 border-ink-900/15 hover:border-ink-900'
                    }`}
                  >
                    {s.label}
                    {full && <span className="block mt-1 text-[10px] normal-case tracking-normal">Fully booked</span>}
                    {tooSoon && <span className="block mt-1 text-[10px] normal-case tracking-normal">Notice required</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <Label htmlFor="notes">Order notes (optional)</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any special requests, e.g. cuts, thickness, allergens"
          />
        </section>

        {createError && (
          <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
            {createError}
          </p>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleProceed}
          disabled={creating || belowDeliveryMinimum || (fulfilment !== 'pickup' && !withinRadius)}
        >
          {creating ? 'Preparing payment…' : 'Continue to payment'}
        </Button>
      </div>

      {/* Right: summary */}
      <aside className="bg-cream-100 border border-ink-900/10 p-6 md:p-8 h-fit lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-ink-900">Your order</h2>

        <ul className="mt-5 divide-y divide-ink-900/10 border-b border-ink-900/10">
          {items.map((item) => (
            <li key={cartKey(item.productId, item.variantLabel, item.marinadeLabel)} className="py-3 flex gap-3 items-center">
              <div className="relative h-14 w-14 shrink-0 bg-ink-900/5">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-ink-900 text-cream-50 text-[10px] font-medium rounded-full flex items-center justify-center tabular">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
                {(item.variantLabel || item.weightLabel || item.marinadeLabel) && (
                  <p className="text-xs text-ink-500">
                    {[item.variantLabel ?? item.weightLabel, item.marinadeLabel].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <p className="text-sm font-medium text-ink-900 tabular shrink-0">
                {formatPrice(item.priceInPence * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Referral reward — automatic, nothing for the customer to enter */}
        {referralCreditApplies && referralSettings && (
          <div className="pt-5">
            <div className="flex items-center gap-2 bg-gold-400/10 border border-gold-400/40 px-3 py-2.5">
              <Gift className="h-4 w-4 text-gold-700 shrink-0" />
              <p className="text-sm text-ink-900">
                Referral reward: {referralSettings.rewardPercent}% off will be applied to this order.
              </p>
            </div>
          </div>
        )}

        {/* Promo */}
        <div className="pt-5">
          {promo ? (
            <div className="flex items-center justify-between gap-2 bg-gold-400/10 border border-gold-400/40 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="h-4 w-4 text-gold-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {promo.code} applied
                  </p>
                  {promo.description && (
                    <p className="text-xs text-ink-500 truncate">{promo.description}</p>
                  )}
                  {promo.productId && (promoTargetSubtotal ?? 0) === 0 && (
                    <p className="text-xs text-butcher-500 mt-0.5">
                      Only applies to {promo.productName ?? 'a specific product'} — add it to your
                      basket for this discount to apply.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={clearPromo}
                className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Label htmlFor="promo">Discount code</Label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyPromo}
                  disabled={applying || !promoCode.trim()}
                >
                  {applying ? '…' : 'Apply'}
                </Button>
              </div>
              {promoError && (
                <p className="text-xs text-butcher-500 mt-2">{promoError}</p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <dl className="mt-6 space-y-2 text-sm border-t border-ink-900/10 pt-5">
          <div className="flex justify-between">
            <dt className="text-ink-700">Subtotal</dt>
            <dd className="tabular text-ink-900">{formatPrice(subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-gold-700">
              <dt>Discount</dt>
              <dd className="tabular">−{formatPrice(totals.discount)}</dd>
            </div>
          )}
          {promo && promo.type !== 'free_delivery' && discountableSubtotal < subtotal && (
            <p className="text-xs text-ink-500 -mt-1">
              Discount codes don&apos;t apply to meat packs.
            </p>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-700">
              {fulfilment === 'pickup' ? 'Pickup' : fulfilment === 'premium' ? 'Premium delivery' : 'Delivery'}
            </dt>
            <dd className="tabular text-ink-900">
              {postcodeFeePending
                ? 'Calculating…'
                : fulfilment !== 'pickup' && !withinRadius
                ? 'Unavailable'
                : totals.deliveryFee === 0
                ? 'Free'
                : formatPrice(totals.deliveryFee)}
            </dd>
          </div>
          {fulfilment === 'sameDay' && sameDaySurcharge > 0 && (
            <p className="text-xs text-ink-500 -mt-1">
              Includes a {formatPrice(sameDaySurcharge)} same-day surcharge.
            </p>
          )}
          <div className="flex justify-between pt-3 border-t border-ink-900/10 text-base">
            <dt className="font-display text-lg text-ink-900">Total</dt>
            <dd className="font-display text-lg tabular text-ink-900">
              {formatPrice(totals.total)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

// ---- Inner Stripe payment form ----

function PaymentForm({
  orderId,
  totalInPence,
  onSuccess,
}: {
  orderId: string;
  totalInPence: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for payment success via redirect-less confirmation
  useEffect(() => {
    if (!stripe) return;
  }, [stripe]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/checkout/success?order=${orderId}`
            : '',
      },
      redirect: 'if_required',
    });
    if (stripeError) {
      console.error('stripe confirmPayment error', stripeError);
      // card_error / validation_error are Stripe's own customer-facing messages
      // (declined card, incomplete details) — safe and useful to show as-is.
      // Anything else (api_error, invalid_request_error, etc.) is a config or
      // integration problem the customer shouldn't see the internals of.
      const safeToShow = stripeError.type === 'card_error' || stripeError.type === 'validation_error';
      setError(
        safeToShow
          ? stripeError.message ?? 'Payment failed — please try again.'
          : "Sorry, we couldn't process that payment. Please try again, or contact us if it keeps happening."
      );
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      // Mark the order paid synchronously (assigns its order number) instead
      // of relying solely on the async Stripe webhook, which can otherwise
      // still be in flight when the customer lands on the success page.
      try {
        await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // The webhook will still confirm it if this call fails.
      }
      onSuccess();
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-cream-100 border border-ink-900/10 p-6 md:p-10">
        <p className="eyebrow text-ink-500 mb-2">Final step</p>
        <h2 className="font-display text-3xl text-ink-900 mb-1">Payment</h2>
        <p className="text-ink-500 text-sm mb-6">
          Total to charge:{' '}
          <span className="font-medium text-ink-900 tabular">
            {formatPrice(totalInPence)}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          {error && (
            <p className="text-sm text-butcher-500 border border-butcher-500/30 bg-butcher-500/5 px-4 py-3">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!stripe || submitting}
          >
            {submitting ? (
              'Processing…'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> Pay {formatPrice(totalInPence)}
              </span>
            )}
          </Button>
          <p className="text-xs text-ink-500 text-center">
            Payments are processed securely by Stripe. Your card details never touch our
            servers.
          </p>
        </form>
      </div>
    </div>
  );
}
