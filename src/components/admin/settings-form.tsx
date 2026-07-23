'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import type { SlotBlock, SlotGroupSettings } from '@/lib/slots';

type ShopSettings = { name: string; address: string; phone: string };
type DeliverySettings = { freeThresholdPence: number; feePence: number; radiusMiles: number };
type BannerSettings = { messages: string[]; showCountdown: boolean; cutoffHour: number };
type AllSettings = {
  shop: ShopSettings;
  delivery: DeliverySettings;
  banner: BannerSettings;
  deliverySlots: SlotGroupSettings;
  sameDay: SlotGroupSettings;
  pickupSlots: SlotGroupSettings;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function minutesToTime(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function newBlockId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now()}${Math.random()}`;
}

function SlotBlocksEditor({
  group,
  onChange,
}: {
  group: SlotGroupSettings;
  onChange: (next: SlotGroupSettings) => void;
}) {
  function updateBlock(id: string, patch: Partial<SlotBlock>) {
    onChange({ ...group, blocks: group.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function addBlock() {
    const last = [...group.blocks].sort((a, b) => a.startMinutes - b.startMinutes).at(-1);
    const start = last ? last.endMinutes : 540;
    onChange({
      ...group,
      blocks: [...group.blocks, { id: newBlockId(), startMinutes: start, endMinutes: start + 60, capacity: 5 }],
    });
  }

  function removeBlock(id: string) {
    onChange({ ...group, blocks: group.blocks.filter((b) => b.id !== id) });
  }

  function toggleDay(day: number) {
    const closedDays = group.closedDays.includes(day)
      ? group.closedDays.filter((d) => d !== day)
      : [...group.closedDays, day].sort();
    onChange({ ...group, closedDays });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[...group.blocks]
          .sort((a, b) => a.startMinutes - b.startMinutes)
          .map((block) => (
            <div key={block.id} className="flex items-center gap-2 flex-wrap">
              <Input
                type="time"
                value={minutesToTime(block.startMinutes)}
                onChange={(e) => updateBlock(block.id, { startMinutes: timeToMinutes(e.target.value) })}
                className="w-32"
              />
              <span className="text-ink-500 text-xs shrink-0">to</span>
              <Input
                type="time"
                value={minutesToTime(block.endMinutes)}
                onChange={(e) => updateBlock(block.id, { endMinutes: timeToMinutes(e.target.value) })}
                className="w-32"
              />
              <Input
                type="number"
                min="0"
                step="1"
                value={block.capacity}
                onChange={(e) => updateBlock(block.id, { capacity: Number(e.target.value) })}
                className="w-20"
                aria-label="Capacity"
              />
              <span className="text-xs text-ink-500 shrink-0">capacity</span>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove slot"
                className="shrink-0 flex items-center justify-center w-9 h-9 text-ink-500 hover:text-butcher-500 hover:bg-butcher-500/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        <button
          type="button"
          onClick={addBlock}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 mt-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add time slot
        </button>
      </div>
      <div>
        <p className="text-xs text-ink-500 mb-1.5">Closed days (no slots offered)</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, day) => (
            <label
              key={day}
              className="flex items-center gap-1.5 text-xs text-ink-700 border border-ink-900/15 px-2 py-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={group.closedDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="h-3.5 w-3.5"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: AllSettings }) {
  const [shop, setShop] = useState<ShopSettings>(initial.shop);
  const [delivery, setDelivery] = useState<DeliverySettings>({
    freeThresholdPence: initial.delivery.freeThresholdPence,
    feePence: initial.delivery.feePence,
    radiusMiles: initial.delivery.radiusMiles ?? 30,
  });
  const [banner, setBanner] = useState<BannerSettings>({
    messages: initial.banner?.messages?.length ? initial.banner.messages : [''],
    showCountdown: initial.banner?.showCountdown ?? true,
    cutoffHour: initial.banner?.cutoffHour ?? 18,
  });
  const [deliverySlots, setDeliverySlots] = useState<SlotGroupSettings>(initial.deliverySlots);
  const [sameDay, setSameDay] = useState<SlotGroupSettings>(initial.sameDay);
  const [pickupSlots, setPickupSlots] = useState<SlotGroupSettings>(initial.pickupSlots);
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
          deliverySlots,
          sameDay,
          pickupSlots,
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

      {/* Delivery radius */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Delivery radius</p>
          <p className="text-xs text-ink-500">
            Orders within the radius use the standard fee above (or get free delivery over the threshold).
            Addresses beyond the radius cannot be delivered to — customers are told to choose pickup instead.
            Distance is calculated automatically from the customer&apos;s postcode at checkout.
          </p>
        </div>
        <div>
          <Label htmlFor="radius">Delivery radius (miles)</Label>
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
          <p className="text-xs text-ink-500 mt-1">Orders beyond this distance can&apos;t be delivered.</p>
        </div>
        <div className="text-sm text-ink-700 bg-cream-50 border border-ink-900/10 px-3 py-2">
          Within <strong>{delivery.radiusMiles} mile{delivery.radiusMiles === 1 ? '' : 's'}</strong>:{' '}
          free over £{(delivery.freeThresholdPence / 100).toFixed(0)}, otherwise £{(delivery.feePence / 100).toFixed(2)}.
          Beyond <strong>{delivery.radiusMiles} mile{delivery.radiusMiles === 1 ? '' : 's'}</strong>: delivery not available.
        </div>
      </section>

      {/* Delivery slots */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Delivery time slots</p>
          <p className="text-xs text-ink-500">
            The time windows customers can pick for regular (next-day and later) home delivery, and
            how many deliveries each window can take. Once a slot is full, customers can no longer select it.
          </p>
        </div>
        <SlotBlocksEditor group={deliverySlots} onChange={setDeliverySlots} />
      </section>

      {/* Same-day delivery slots */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Same-day delivery slots</p>
          <p className="text-xs text-ink-500">
            Time windows for same-day delivery, today only. Only products marked &quot;Available same
            day&quot; are eligible — a basket with any item requiring advance notice can&apos;t use
            same-day delivery. Set a slot&apos;s capacity to 0 to turn it off, or remove it entirely —
            e.g. delete anything after 5pm so same-day deliveries stop being offered past then.
          </p>
        </div>
        <SlotBlocksEditor group={sameDay} onChange={setSameDay} />
      </section>

      {/* Pickup slots */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Pickup (click &amp; collect) time slots</p>
          <p className="text-xs text-ink-500">
            The time windows customers can pick for in-store pickup, and how many collections each
            window can take.
          </p>
        </div>
        <SlotBlocksEditor group={pickupSlots} onChange={setPickupSlots} />
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
