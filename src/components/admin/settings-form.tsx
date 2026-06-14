'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

type ShopSettings = { name: string; address: string; phone: string };
type DeliverySettings = { freeThresholdPence: number; feePence: number; radiusMiles: number; premiumFeePence: number };
type AllSettings = { shop: ShopSettings; delivery: DeliverySettings };

export function SettingsForm({ initial }: { initial: AllSettings }) {
  const [shop, setShop] = useState<ShopSettings>(initial.shop);
  const [delivery, setDelivery] = useState<DeliverySettings>({
    freeThresholdPence: initial.delivery.freeThresholdPence,
    feePence: initial.delivery.feePence,
    radiusMiles: initial.delivery.radiusMiles ?? 10,
    premiumFeePence: initial.delivery.premiumFeePence ?? 500,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function priceToPence(v: string) {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : Math.round(n * 100);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shop, delivery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">

      {/* Shop details */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Shop</p>
          <p className="text-xs text-ink-500">Displayed in the site footer and contact page.</p>
        </div>
        <div>
          <Label htmlFor="shopName">Shop name</Label>
          <Input
            id="shopName"
            value={shop.name}
            onChange={(e) => setShop({ ...shop, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="shopAddress">Address</Label>
          <Input
            id="shopAddress"
            value={shop.address}
            onChange={(e) => setShop({ ...shop, address: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="shopPhone">Phone number</Label>
          <Input
            id="shopPhone"
            type="tel"
            value={shop.phone}
            onChange={(e) => setShop({ ...shop, phone: e.target.value })}
            required
          />
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Delivery</p>
          <p className="text-xs text-ink-500">Controls the delivery fee shown to customers at checkout.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="threshold">Free delivery threshold (£)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0"
              value={(delivery.freeThresholdPence / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({ ...delivery, freeThresholdPence: priceToPence(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">Orders at or above this value get free delivery.</p>
          </div>
          <div>
            <Label htmlFor="fee">Standard delivery fee (£)</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              min="0"
              value={(delivery.feePence / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({ ...delivery, feePence: priceToPence(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">Charged on orders below the threshold.</p>
          </div>
        </div>
        <div className="text-sm text-ink-700 bg-cream-50 border border-ink-900/10 px-3 py-2">
          Current: orders under <strong>£{(delivery.freeThresholdPence / 100).toFixed(2)}</strong> are
          charged <strong>£{(delivery.feePence / 100).toFixed(2)}</strong> for delivery.
          Orders of £{(delivery.freeThresholdPence / 100).toFixed(2)} or more get free delivery.
        </div>
      </section>

      {/* Distance-based delivery pricing */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Distance pricing</p>
          <p className="text-xs text-ink-500">
            Set a radius boundary. Orders within the radius use the standard fee above (or get free delivery over the threshold).
            Orders beyond the radius are always charged the premium fee.
            Distance is calculated automatically from the customer&apos;s postcode at checkout.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="radius">Near zone radius (miles)</Label>
            <Input
              id="radius"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={delivery.radiusMiles}
              onChange={(e) =>
                setDelivery({ ...delivery, radiusMiles: Number(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">Orders within this distance use the standard fee.</p>
          </div>
          <div>
            <Label htmlFor="premiumFee">Premium delivery fee — beyond radius (£)</Label>
            <Input
              id="premiumFee"
              type="number"
              step="0.01"
              min="0"
              value={(delivery.premiumFeePence / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({ ...delivery, premiumFeePence: priceToPence(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">Always charged for addresses beyond the radius.</p>
          </div>
        </div>
        <div className="text-sm text-ink-700 bg-cream-50 border border-ink-900/10 px-3 py-2">
          Within <strong>{delivery.radiusMiles} mile{delivery.radiusMiles === 1 ? '' : 's'}</strong>:{' '}
          free over £{(delivery.freeThresholdPence / 100).toFixed(0)}, otherwise £{(delivery.feePence / 100).toFixed(2)}.
          Beyond <strong>{delivery.radiusMiles} mile{delivery.radiusMiles === 1 ? '' : 's'}</strong>:{' '}
          always £{(delivery.premiumFeePence / 100).toFixed(2)}.
        </div>
      </section>

      {error && (
        <p className="text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-ink-900/10 pt-6">
        {saved && (
          <span className="text-sm text-green-600 font-medium">✓ Settings saved</span>
        )}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
