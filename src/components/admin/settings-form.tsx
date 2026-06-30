'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

type ShopSettings = { name: string; address: string; phone: string };
type DeliverySettings = { freeThresholdPence: number; feePence: number; radiusMiles: number; premiumFeePence: number };
type BannerSettings = { messages: string[]; showCountdown: boolean; cutoffHour: number };
type AllSettings = { shop: ShopSettings; delivery: DeliverySettings; banner: BannerSettings };

export function SettingsForm({ initial }: { initial: AllSettings }) {
  const [shop, setShop] = useState<ShopSettings>(initial.shop);
  const [delivery, setDelivery] = useState<DeliverySettings>({
    freeThresholdPence: initial.delivery.freeThresholdPence,
    feePence: initial.delivery.feePence,
    radiusMiles: initial.delivery.radiusMiles ?? 10,
    premiumFeePence: initial.delivery.premiumFeePence ?? 500,
  });
  const [banner, setBanner] = useState<BannerSettings>({
    messages: initial.banner?.messages?.length ? initial.banner.messages : [''],
    showCountdown: initial.banner?.showCountdown ?? true,
    cutoffHour: initial.banner?.cutoffHour ?? 18,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateMessage(index: number, value: string) {
    const next = [...banner.messages];
    next[index] = value;
    setBanner({ ...banner, messages: next });
  }

  function addMessage() {
    setBanner({ ...banner, messages: [...banner.messages, ''] });
  }

  function removeMessage(index: number) {
    setBanner({ ...banner, messages: banner.messages.filter((_, i) => i !== index) });
  }

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
      const cleanedMessages = banner.messages.map((m) => m.trim()).filter(Boolean);
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shop,
          delivery,
          banner: { ...banner, messages: cleanedMessages },
        }),
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

      {/* Announcement banner */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Announcement banner</p>
          <p className="text-xs text-ink-500">
            The scrolling banner at the top of the site. Each line below rotates through the marquee.
          </p>
        </div>

        <div className="space-y-2">
          {banner.messages.map((message, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => updateMessage(i, e.target.value)}
                placeholder="e.g. Free home delivery on orders over £25"
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => removeMessage(i)}
                aria-label="Remove message"
                className="shrink-0 flex items-center justify-center w-9 h-9 text-ink-500 hover:text-butcher-500 hover:bg-butcher-500/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMessage}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add message
          </button>
        </div>

        <div className="border-t border-ink-900/10 pt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={banner.showCountdown}
              onChange={(e) => setBanner({ ...banner, showCountdown: e.target.checked })}
              className="h-4 w-4"
            />
            Show a live &quot;order within X minutes for next-day delivery&quot; message
          </label>
          {banner.showCountdown && (
            <div className="max-w-xs">
              <Label htmlFor="cutoffHour">Next-day delivery cutoff time</Label>
              <select
                id="cutoffHour"
                value={banner.cutoffHour}
                onChange={(e) => setBanner({ ...banner, cutoffHour: Number(e.target.value) })}
                className="w-full border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-500 mt-1">
                Orders placed after this time will see a tomorrow-cutoff message instead of a countdown.
              </p>
            </div>
          )}
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
