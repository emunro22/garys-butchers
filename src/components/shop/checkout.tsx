'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCart, cartSubtotal, cartKey } from '@/lib/cart';
import { formatPrice, calculateDelivery } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Truck, Store, Tag, Check } from 'lucide-react';
import { useCustomerSession } from '@/components/account/session-provider';
import { generateDeliverySlots, getDeliveryDateKey, bucketKey, type DeliveryBlockKey } from '@/lib/delivery-slots';
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

type Fulfilment = 'pickup' | 'delivery';

type Promo = {
  id: string;
  code: string;
  type: 'percent_off' | 'amount_off' | 'free_delivery';
  value: number;
  description?: string | null;
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
          setPrefilled(true);
        }
      })
      .catch(() => {});
  }, [user, prefilled]);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<Promo>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);

  const [postcodeFeePence, setPostcodeFeePence] = useState<number | null>(null);
  const [postcodeFeePending, setPostcodeFeePending] = useState(false);
  const [withinRadius, setWithinRadius] = useState(true);

  useEffect(() => {
    if (fulfilment !== 'delivery' || form.postcode.replace(/\s/g, '').length < 5) {
      setPostcodeFeePence(null);
      setWithinRadius(true);
      return;
    }
    setPostcodeFeePending(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/delivery-fee?postcode=${encodeURIComponent(form.postcode)}&subtotal=${subtotal}`
        );
        if (res.ok) {
          const data = await res.json();
          setPostcodeFeePence(data.feePence);
          setWithinRadius(data.withinRadius ?? true);
        }
      } finally {
        setPostcodeFeePending(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.postcode, subtotal, fulfilment]);

  const deliveryFee =
    fulfilment === 'pickup'
      ? 0
      : postcodeFeePence !== null
      ? postcodeFeePence
      : calculateDelivery(subtotal, fulfilment);

  const totals = useMemo(() => {
    let discount = 0;
    let dFee = deliveryFee;
    if (promo) {
      if (promo.type === 'percent_off') {
        discount = Math.round((subtotal * promo.value) / 100);
      } else if (promo.type === 'amount_off') {
        discount = Math.min(promo.value, subtotal);
      } else if (promo.type === 'free_delivery') {
        dFee = 0;
      }
    }
    const total = Math.max(0, subtotal - discount) + dFee;
    return { discount, deliveryFee: dFee, total };
  }, [subtotal, deliveryFee, promo]);

  // Pickup: next 7 collection slots (skip Sunday) — hourly Mon-Fri, fixed Saturday slots.
  const pickupSlots = useMemo(() => {
    const out: { value: string; label: string; blockKey?: undefined; dateKey: string }[] = [];
    const now = new Date();
    let d = new Date(now);
    d.setHours(0, 0, 0, 0);
    while (out.length < 7) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue; // closed Sunday
      const dateStr = d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
      const dateKey = getDeliveryDateKey(d);
      if (d.getDay() === 6) {
        // Sat 7:30–2, unchanged
        ['08:00', '09:30', '11:00', '12:30'].forEach((t) => {
          const iso = new Date(d);
          const [h, m] = t.split(':').map(Number);
          iso.setHours(h, m, 0, 0);
          out.push({ value: iso.toISOString(), label: `${dateStr} · ${t}`, dateKey });
        });
      } else {
        // Mon–Fri 9–6, hourly slots
        const hourRanges = [
          [9, 10], [10, 11], [11, 12], [12, 13],
          [13, 14], [14, 15], [15, 16], [16, 17], [17, 18],
        ];
        const fmt = (h: number) => (h > 12 ? h - 12 : h);
        const suffix = (h: number) => (h >= 12 ? 'pm' : 'am');
        hourRanges.forEach(([startHour, endHour]) => {
          const iso = new Date(d);
          iso.setHours(startHour, 0, 0, 0);
          out.push({
            value: iso.toISOString(),
            label: `${dateStr} · ${fmt(startHour)}-${fmt(endHour)}${suffix(endHour)}`,
            dateKey,
          });
        });
      }
    }
    return out;
  }, []);

  // Delivery: next 7 eligible days (skip Sunday), 3-hour blocks (9-12 / 12-3 / 3-6).
  const deliverySlots = useMemo(() => generateDeliverySlots(7), []);

  const slots = fulfilment === 'delivery' ? deliverySlots : pickupSlots;

  // Earliest allowed date given the most demanding notice period among cart items.
  const maxNoticeDays = useMemo(
    () => items.reduce((max, i) => Math.max(max, i.noticeDays ?? 0), 0),
    [items]
  );
  const earliestSlotDateKey = slots[0]?.dateKey;
  const minAllowedDateKey = useMemo(() => {
    if (maxNoticeDays === 0 || !earliestSlotDateKey) return earliestSlotDateKey;
    const d = new Date(`${earliestSlotDateKey}T00:00:00`);
    d.setDate(d.getDate() + maxNoticeDays);
    return getDeliveryDateKey(d);
  }, [maxNoticeDays, earliestSlotDateKey]);

  function isSlotTooSoon(s: { dateKey?: string }) {
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

  // Delivery slot availability (only relevant for delivery)
  const [availability, setAvailability] = useState<Record<string, { count: number; capacity: number }>>({});

  useEffect(() => {
    if (fulfilment !== 'delivery') return;
    fetch('/api/delivery-availability')
      .then((r) => r.json())
      .then((data) => setAvailability(data.availability ?? {}))
      .catch(() => {});
  }, [fulfilment]);

  function isSlotFull(s: { blockKey?: DeliveryBlockKey; dateKey?: string }) {
    if (!s.blockKey || !s.dateKey) return false;
    const info = availability[bucketKey(s.dateKey, s.blockKey)];
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
        body: JSON.stringify({ code: promoCode.trim(), subtotalInPence: subtotal }),
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
    if (!form.slot) return 'Please choose a time slot.';
    const chosenSlot = slots.find((s) => s.value === form.slot);
    if (chosenSlot && isSlotTooSoon(chosenSlot)) {
      return `That slot doesn't meet the ${noticeLabel(maxNoticeDays).toLowerCase()} for an item in your basket.`;
    }
    if (fulfilment === 'delivery') {
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
          fulfilment,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          deliveryAddress:
            fulfilment === 'delivery'
              ? {
                  line1: form.line1,
                  line2: form.line2 || undefined,
                  city: form.city,
                  postcode: form.postcode,
                }
              : null,
          slot: form.slot,
          notes: form.notes || undefined,
          promotionCode: promo?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout');
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Could not start checkout');
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
          <div className="grid grid-cols-2 gap-3">
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
                Free over £25 (near zone) · from £2.50
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
          </div>
        </section>

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

        {/* Address (delivery only) */}
        {fulfilment === 'delivery' && (
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
                    Sorry — that&apos;s outside our 30 mile delivery area. Please choose{' '}
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
            {fulfilment === 'delivery' ? '4. Delivery slot' : '3. Pickup slot'}
          </h2>
          {maxNoticeDays > 0 && (
            <p className="text-xs text-butcher-500 mb-3">
              Your basket includes an item that needs {noticeLabel(maxNoticeDays).toLowerCase()} — earlier slots are unavailable.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
            {slots.map((s) => {
              const full = isSlotFull(s);
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
          disabled={creating || (fulfilment === 'delivery' && !withinRadius)}
        >
          {creating ? 'Preparing payment…' : 'Continue to payment'}
        </Button>
      </div>

      {/* Right: summary */}
      <aside className="bg-cream-100 border border-ink-900/10 p-6 md:p-8 h-fit lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-ink-900">Your order</h2>

        <ul className="mt-5 divide-y divide-ink-900/10 border-b border-ink-900/10">
          {items.map((item) => (
            <li key={cartKey(item.productId, item.variantLabel)} className="py-3 flex gap-3 items-center">
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
                {(item.variantLabel || item.weightLabel) && (
                  <p className="text-xs text-ink-500">{item.variantLabel ?? item.weightLabel}</p>
                )}
              </div>
              <p className="text-sm font-medium text-ink-900 tabular shrink-0">
                {formatPrice(item.priceInPence * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

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
          <div className="flex justify-between">
            <dt className="text-ink-700">
              {fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
            </dt>
            <dd className="tabular text-ink-900">
              {postcodeFeePending
                ? 'Calculating…'
                : totals.deliveryFee === 0
                ? 'Free'
                : formatPrice(totals.deliveryFee)}
            </dd>
          </div>
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
      setError(stripeError.message ?? 'Payment failed');
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
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
