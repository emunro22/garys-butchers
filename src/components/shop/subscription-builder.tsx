'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { blockLabel, type SlotBlock } from '@/lib/slots';
import { useCustomerSession } from '@/components/account/session-provider';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

type EligibleProduct = {
  id: string;
  name: string;
  slug: string;
  priceInPence: number;
  imageUrl: string | null;
  weightLabel: string | null;
};

export function SubscriptionBuilder({
  products,
  deliveryBlocks,
  pickupBlocks,
}: {
  products: EligibleProduct[];
  deliveryBlocks: SlotBlock[];
  pickupBlocks: SlotBlock[];
}) {
  const router = useRouter();
  const { user } = useCustomerSession();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [fulfilment, setFulfilment] = useState<'pickup' | 'delivery'>('delivery');
  const [address, setAddress] = useState({ line1: '', line2: '', city: 'Erskine', postcode: '' });
  const [preferredDay, setPreferredDay] = useState(1);
  const blocks = fulfilment === 'delivery' ? deliveryBlocks : pickupBlocks;
  const [preferredBlockId, setPreferredBlockId] = useState(blocks[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setQty(productId: string, qty: number) {
    setQuantities((q) => ({ ...q, [productId]: Math.max(0, Math.min(20, qty)) }));
  }

  const selected = useMemo(
    () => products.filter((p) => (quantities[p.id] ?? 0) > 0),
    [products, quantities]
  );

  const monthlyTotal = useMemo(
    () => selected.reduce((sum, p) => sum + p.priceInPence * (quantities[p.id] ?? 0), 0),
    [selected, quantities]
  );

  function changeFulfilment(next: 'pickup' | 'delivery') {
    setFulfilment(next);
    const nextBlocks = next === 'delivery' ? deliveryBlocks : pickupBlocks;
    setPreferredBlockId(nextBlocks[0]?.id ?? '');
  }

  async function handleSubmit() {
    setError(null);
    if (!user) {
      router.push(`/account/login?next=${encodeURIComponent('/subscriptions/build')}`);
      return;
    }
    if (selected.length === 0) {
      setError('Add at least one item to your subscription.');
      return;
    }
    if (fulfilment === 'delivery' && (!address.line1 || !address.city || !address.postcode)) {
      setError('Please fill in your delivery address.');
      return;
    }
    if (!preferredBlockId) {
      setError('Please choose a preferred time window.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: selected.map((p) => ({ productId: p.id, quantity: quantities[p.id] })),
          fulfilment,
          deliveryAddress: fulfilment === 'delivery' ? address : undefined,
          preferredBlockId,
          preferredDayOfMonth: preferredDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not start your subscription');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start your subscription');
      setSubmitting(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-cream-100 border border-ink-900/10">
        <ShoppingBag className="h-10 w-10 text-ink-300 mx-auto mb-4" />
        <p className="font-display text-xl text-ink-700">No subscription items yet</p>
        <p className="text-sm text-ink-500 mt-1">Check back soon — we&apos;re still setting this up.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      {/* Product picker */}
      <div className="space-y-2">
        {products.map((p) => {
          const qty = quantities[p.id] ?? 0;
          return (
            <div key={p.id} className="flex items-center gap-4 bg-cream-100 border border-ink-900/10 p-4">
              <div className="relative h-16 w-16 shrink-0 bg-ink-900/5">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-300">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{p.name}</p>
                <p className="text-xs text-ink-500">
                  {formatPrice(p.priceInPence)}
                  {p.weightLabel ? ` · ${p.weightLabel}` : ''} / month each
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(p.id, qty - 1)}
                  disabled={qty === 0}
                  className="h-8 w-8 flex items-center justify-center border border-ink-900/15 text-ink-700 hover:bg-ink-900/5 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm tabular">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(p.id, qty + 1)}
                  className="h-8 w-8 flex items-center justify-center border border-ink-900/15 text-ink-700 hover:bg-ink-900/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary / setup */}
      <div className="bg-cream-100 border border-ink-900/10 p-6 space-y-5 h-fit lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl text-ink-900">Monthly total</p>
          <p className="font-display text-2xl text-ink-900 tabular">{formatPrice(monthlyTotal)}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">Fulfilment</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => changeFulfilment('delivery')}
              className={`px-3 py-2.5 text-sm border transition-colors ${
                fulfilment === 'delivery' ? 'bg-ink-900 text-cream-50 border-ink-900' : 'border-ink-900/15 text-ink-700'
              }`}
            >
              Delivery
            </button>
            <button
              type="button"
              onClick={() => changeFulfilment('pickup')}
              className={`px-3 py-2.5 text-sm border transition-colors ${
                fulfilment === 'pickup' ? 'bg-ink-900 text-cream-50 border-ink-900' : 'border-ink-900/15 text-ink-700'
              }`}
            >
              Pickup
            </button>
          </div>
        </div>

        {fulfilment === 'delivery' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="line1">Address line 1</Label>
              <Input id="line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="line2">Address line 2 (optional)</Label>
              <Input id="line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="preferredDay">Preferred day of the month</Label>
          <select
            id="preferredDay"
            value={preferredDay}
            onChange={(e) => setPreferredDay(Number(e.target.value))}
            className="w-full border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <p className="text-xs text-ink-400 mt-1">
            We&apos;ll aim for this day each month — if it&apos;s fully booked we&apos;ll use the nearest available day.
          </p>
        </div>

        <div>
          <Label htmlFor="preferredBlock">Preferred time window</Label>
          <select
            id="preferredBlock"
            value={preferredBlockId}
            onChange={(e) => setPreferredBlockId(e.target.value)}
            className="w-full border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>{blockLabel(b)}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">{error}</p>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Starting…' : user ? 'Start subscription' : 'Sign in to subscribe'}
        </Button>
        <p className="text-xs text-ink-400 text-center">
          Charged monthly to your card via Stripe. Cancel anytime from your account.
        </p>
      </div>
    </div>
  );
}
