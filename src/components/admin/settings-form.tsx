'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import type { SlotBlock, SlotGroupSettings } from '@/lib/slots';

type ShopSettings = { name: string; address: string; phone: string };
type DeliverySettings = {
  freeUnderMiles: number;
  midTierMiles: number;
  midTierFeePence: number;
  farFeePence: number;
  radiusMiles: number;
};
type BannerSettings = { messages: string[]; showCountdown: boolean; cutoffHour: number };
type PromotionsSettings = { singleUsePerCustomer: boolean };
type ReferralsSettings = { enabled: boolean; rewardPercent: number };
type SeasonalSettings = { theme: 'none' | 'christmas' | 'easter' };
type PremiumDeliverySettings = {
  enabled: boolean;
  minimumFeeInPence: number;
  ratePerKgInPence: number;
  carriers: string[];
  description: string;
};
type SameDayFeeSettings = { enabled: boolean; feeInPence: number };
type AllSettings = {
  shop: ShopSettings;
  delivery: DeliverySettings;
  premiumDelivery: PremiumDeliverySettings;
  banner: BannerSettings;
  promotions: PromotionsSettings;
  referrals: ReferralsSettings;
  seasonal: SeasonalSettings;
  deliverySlots: SlotGroupSettings;
  sameDay: SlotGroupSettings;
  sameDayFee: SameDayFeeSettings;
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
  showOrderCutoff,
}: {
  group: SlotGroupSettings;
  onChange: (next: SlotGroupSettings) => void;
  showOrderCutoff?: boolean;
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
      <div>
        <label className="flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={group.saturdayCutoffMinutes != null}
            onChange={(e) =>
              onChange({
                ...group,
                saturdayCutoffMinutes: e.target.checked ? group.saturdayCutoffMinutes ?? 840 : null,
              })
            }
            className="h-3.5 w-3.5"
          />
          Close earlier on Saturdays
        </label>
        {group.saturdayCutoffMinutes != null && (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <Input
              type="time"
              value={minutesToTime(group.saturdayCutoffMinutes)}
              onChange={(e) => onChange({ ...group, saturdayCutoffMinutes: timeToMinutes(e.target.value) })}
              className="w-32"
            />
            <span className="text-xs text-ink-500">no slots starting at or after this time on Saturdays</span>
          </div>
        )}
      </div>
      {showOrderCutoff && (
        <div>
          <label className="flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
            <input
              type="checkbox"
              checked={group.orderCutoffMinutes != null}
              onChange={(e) =>
                onChange({
                  ...group,
                  orderCutoffMinutes: e.target.checked ? group.orderCutoffMinutes ?? 840 : null,
                })
              }
              className="h-3.5 w-3.5"
            />
            Stop taking orders before the delivery window starts
          </label>
          {group.orderCutoffMinutes != null && (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <Input
                type="time"
                value={minutesToTime(group.orderCutoffMinutes)}
                onChange={(e) => onChange({ ...group, orderCutoffMinutes: timeToMinutes(e.target.value) })}
                className="w-32"
              />
              <span className="text-xs text-ink-500">
                no same-day orders accepted at or after this time, even though the delivery window itself is
                later
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: AllSettings }) {
  const [shop, setShop] = useState<ShopSettings>(initial.shop);
  const [delivery, setDelivery] = useState<DeliverySettings>({
    freeUnderMiles: initial.delivery.freeUnderMiles,
    midTierMiles: initial.delivery.midTierMiles,
    midTierFeePence: initial.delivery.midTierFeePence,
    farFeePence: initial.delivery.farFeePence,
    radiusMiles: initial.delivery.radiusMiles ?? 30,
  });
  const [banner, setBanner] = useState<BannerSettings>({
    messages: initial.banner?.messages?.length ? initial.banner.messages : [''],
    showCountdown: initial.banner?.showCountdown ?? true,
    cutoffHour: initial.banner?.cutoffHour ?? 18,
  });
  const [premiumDelivery, setPremiumDelivery] = useState<PremiumDeliverySettings>({
    enabled: initial.premiumDelivery?.enabled ?? true,
    minimumFeeInPence: initial.premiumDelivery?.minimumFeeInPence ?? 2000,
    ratePerKgInPence: initial.premiumDelivery?.ratePerKgInPence ?? 150,
    carriers: initial.premiumDelivery?.carriers?.length ? initial.premiumDelivery.carriers : [''],
    description: initial.premiumDelivery?.description ?? '',
  });
  const [promotionsSettings, setPromotionsSettings] = useState<PromotionsSettings>({
    singleUsePerCustomer: initial.promotions?.singleUsePerCustomer ?? false,
  });
  const [referralsSettings, setReferralsSettings] = useState<ReferralsSettings>({
    enabled: initial.referrals?.enabled ?? true,
    rewardPercent: initial.referrals?.rewardPercent ?? 5,
  });
  const [seasonalSettings, setSeasonalSettings] = useState<SeasonalSettings>({
    theme: initial.seasonal?.theme ?? 'none',
  });
  const [deliverySlots, setDeliverySlots] = useState<SlotGroupSettings>(initial.deliverySlots);
  const [sameDay, setSameDay] = useState<SlotGroupSettings>(initial.sameDay);
  const [sameDayFee, setSameDayFee] = useState<SameDayFeeSettings>({
    enabled: initial.sameDayFee?.enabled ?? false,
    feeInPence: initial.sameDayFee?.feeInPence ?? 500,
  });
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

  function updateCarrier(index: number, value: string) {
    const next = [...premiumDelivery.carriers];
    next[index] = value;
    setPremiumDelivery({ ...premiumDelivery, carriers: next });
  }

  function addCarrier() {
    setPremiumDelivery({ ...premiumDelivery, carriers: [...premiumDelivery.carriers, ''] });
  }

  function removeCarrier(index: number) {
    setPremiumDelivery({ ...premiumDelivery, carriers: premiumDelivery.carriers.filter((_, i) => i !== index) });
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
      const cleanedCarriers = premiumDelivery.carriers.map((c) => c.trim()).filter(Boolean);
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shop,
          delivery,
          premiumDelivery: { ...premiumDelivery, carriers: cleanedCarriers },
          banner: { ...banner, messages: cleanedMessages },
          promotions: promotionsSettings,
          referrals: referralsSettings,
          seasonal: seasonalSettings,
          deliverySlots,
          sameDay,
          sameDayFee,
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
          <p className="eyebrow text-ink-500 mb-1">Delivery pricing</p>
          <p className="text-xs text-ink-500">
            The delivery fee is based on how far the customer is from the shop (calculated
            automatically from their postcode at checkout), not their order value.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="freeUnderMiles">Free delivery under (miles)</Label>
            <Input
              id="freeUnderMiles"
              type="number"
              step="0.5"
              min="0"
              value={delivery.freeUnderMiles}
              onChange={(e) =>
                setDelivery({ ...delivery, freeUnderMiles: Number(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">Addresses closer than this get free delivery.</p>
          </div>
          <div>
            <Label htmlFor="midTierMiles">Mid-tier fee applies up to (miles)</Label>
            <Input
              id="midTierMiles"
              type="number"
              step="0.5"
              min="0"
              value={delivery.midTierMiles}
              onChange={(e) =>
                setDelivery({ ...delivery, midTierMiles: Number(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="midTierFee">Mid-tier delivery fee (£)</Label>
            <Input
              id="midTierFee"
              type="number"
              step="0.01"
              min="0"
              value={(delivery.midTierFeePence / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({ ...delivery, midTierFeePence: priceToPence(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">
              Charged between the free radius and the mid-tier distance.
            </p>
          </div>
          <div>
            <Label htmlFor="farFee">Far delivery fee (£)</Label>
            <Input
              id="farFee"
              type="number"
              step="0.01"
              min="0"
              value={(delivery.farFeePence / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({ ...delivery, farFeePence: priceToPence(e.target.value) })
              }
              required
            />
            <p className="text-xs text-ink-500 mt-1">
              Charged beyond the mid-tier distance, up to the delivery radius below.
            </p>
          </div>
        </div>
        <div className="text-sm text-ink-700 bg-cream-50 border border-ink-900/10 px-3 py-2">
          Under <strong>{delivery.freeUnderMiles} mile{delivery.freeUnderMiles === 1 ? '' : 's'}</strong>: free.{' '}
          <strong>{delivery.freeUnderMiles}–{delivery.midTierMiles} miles</strong>: £{(delivery.midTierFeePence / 100).toFixed(2)}.{' '}
          <strong>{delivery.midTierMiles}+ miles</strong>: £{(delivery.farFeePence / 100).toFixed(2)}.
        </div>
      </section>

      {/* Delivery radius */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Delivery radius</p>
          <p className="text-xs text-ink-500">
            Addresses beyond the radius cannot be delivered to. Customers are told to choose pickup instead.
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
      </section>

      {/* Premium / bulk delivery */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Premium / bulk delivery</p>
          <p className="text-xs text-ink-500">
            A courier-fulfilled option for bulk orders and addresses outside our usual area. Only
            appears at checkout for customers you&apos;ve flagged as eligible on their customer
            profile. The minimum fee below is what the customer sees and pays at checkout; the
            rate per kg is only used by the weight calculator on the order, to help you work out
            what to actually charge or invoice for.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={premiumDelivery.enabled}
            onChange={(e) => setPremiumDelivery({ ...premiumDelivery, enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Offer premium / bulk delivery
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="premiumMinFee">Minimum fee shown to customer (£)</Label>
            <Input
              id="premiumMinFee"
              type="number"
              step="0.01"
              min="0"
              value={(premiumDelivery.minimumFeeInPence / 100).toFixed(2)}
              onChange={(e) =>
                setPremiumDelivery({ ...premiumDelivery, minimumFeeInPence: priceToPence(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="premiumRatePerKg">Rate per kg for the admin calculator (£)</Label>
            <Input
              id="premiumRatePerKg"
              type="number"
              step="0.01"
              min="0"
              value={(premiumDelivery.ratePerKgInPence / 100).toFixed(2)}
              onChange={(e) =>
                setPremiumDelivery({ ...premiumDelivery, ratePerKgInPence: priceToPence(e.target.value) })
              }
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="premiumDescription">Customer-facing description</Label>
          <Textarea
            id="premiumDescription"
            value={premiumDelivery.description}
            onChange={(e) => setPremiumDelivery({ ...premiumDelivery, description: e.target.value })}
            rows={2}
            maxLength={500}
          />
        </div>
        <div>
          <p className="text-xs text-ink-500 mb-1.5">Couriers (shown to the customer, and offered as options in the order calculator)</p>
          <div className="space-y-2">
            {premiumDelivery.carriers.map((carrier, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={carrier}
                  onChange={(e) => updateCarrier(i, e.target.value)}
                  placeholder="e.g. DHL"
                  maxLength={60}
                />
                <button
                  type="button"
                  onClick={() => removeCarrier(i)}
                  aria-label="Remove courier"
                  className="shrink-0 flex items-center justify-center w-9 h-9 text-ink-500 hover:text-butcher-500 hover:bg-butcher-500/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCarrier}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add courier
            </button>
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Promotions</p>
          <p className="text-xs text-ink-500">
            Controls how discount codes can be redeemed at checkout.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={promotionsSettings.singleUsePerCustomer}
            onChange={(e) =>
              setPromotionsSettings({ ...promotionsSettings, singleUsePerCustomer: e.target.checked })
            }
            className="h-4 w-4"
          />
          Limit each discount code to one use per customer
        </label>
        <p className="text-xs text-ink-500">
          When on, a customer who has already used a discount code on a completed order (whether
          they checked out as a guest or while signed in) will be blocked from applying that same
          code again, by matching the email address on the order.
        </p>
      </section>

      {/* Referrals */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Referral scheme</p>
          <p className="text-xs text-ink-500">
            Each customer gets a shareable referral link from their account. Once someone they
            referred signs up and completes their first paid order, the referrer is automatically
            given a one-time discount off their next order, with no code to enter.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={referralsSettings.enabled}
            onChange={(e) => setReferralsSettings({ ...referralsSettings, enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Enable the referral scheme
        </label>
        <div className="max-w-[220px]">
          <Label htmlFor="referralReward">Reward for the referrer (%)</Label>
          <Input
            id="referralReward"
            type="number"
            min="1"
            max="100"
            value={referralsSettings.rewardPercent}
            onChange={(e) =>
              setReferralsSettings({ ...referralsSettings, rewardPercent: Number(e.target.value) || 1 })
            }
          />
        </div>
      </section>

      {/* Seasonal theme */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Seasonal theme</p>
          <p className="text-xs text-ink-500">
            Recolours the storefront, adds a themed banner, and drops small decorations onto
            product and category tiles. Only one can be active at a time; switch back to
            &quot;None&quot; to return to the normal look. Doesn&apos;t affect this admin panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(
            [
              { value: 'none', label: 'None (normal)' },
              { value: 'christmas', label: '🎄 Christmas mode' },
              { value: 'easter', label: '🐣 Easter mode' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 text-sm px-4 py-2.5 border cursor-pointer transition-colors ${
                seasonalSettings.theme === opt.value
                  ? 'border-ink-900 bg-ink-900 text-cream-50'
                  : 'border-ink-900/15 text-ink-700 hover:border-ink-900'
              }`}
            >
              <input
                type="radio"
                name="seasonalTheme"
                value={opt.value}
                checked={seasonalSettings.theme === opt.value}
                onChange={() => setSeasonalSettings({ theme: opt.value })}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
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
            day&quot; are eligible, so a basket with any item requiring advance notice can&apos;t use
            same-day delivery. Set a slot&apos;s capacity to 0 to turn it off, or remove it entirely,
            e.g. delete anything after 5pm so same-day deliveries stop being offered past then.
          </p>
        </div>
        <SlotBlocksEditor group={sameDay} onChange={setSameDay} showOrderCutoff />
      </section>

      {/* Same-day delivery fee */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Same-day delivery fee</p>
          <p className="text-xs text-ink-500">
            An optional rush-delivery surcharge, added on top of the normal distance-based delivery
            fee above, only for orders placed with a same-day slot.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={sameDayFee.enabled}
            onChange={(e) => setSameDayFee({ ...sameDayFee, enabled: e.target.checked })}
            className="h-4 w-4"
          />
          Charge extra for same-day delivery
        </label>
        {sameDayFee.enabled && (
          <div className="max-w-xs">
            <Label htmlFor="sameDayFeeAmount">Same-day surcharge (£)</Label>
            <Input
              id="sameDayFeeAmount"
              type="number"
              step="0.01"
              min="0"
              value={(sameDayFee.feeInPence / 100).toFixed(2)}
              onChange={(e) => setSameDayFee({ ...sameDayFee, feeInPence: priceToPence(e.target.value) })}
              required
            />
            <p className="text-xs text-ink-500 mt-2">
              Added on top of the normal delivery fee, e.g. free under {delivery.freeUnderMiles} miles
              + £{(sameDayFee.feeInPence / 100).toFixed(2)} same-day surcharge ={' '}
              £{(sameDayFee.feeInPence / 100).toFixed(2)} for a nearby same-day order.
            </p>
          </div>
        )}
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
                placeholder="e.g. Free home delivery within 5 miles"
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
