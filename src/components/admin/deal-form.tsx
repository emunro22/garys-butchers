'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, X, Search, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import type { Deal } from '@/lib/db/schema';

type DealCategory = 'christmas' | 'easter' | 'summer-bbq' | 'general';
type DealStatus = 'draft' | 'published';

type ProductOption = {
  id: string;
  name: string;
  priceInPence: number;
  imageUrl: string | null;
  weightLabel: string | null;
  slug: string;
};

type DealItemState = ProductOption & { quantity: number };

const CATEGORY_OPTIONS: { value: DealCategory; label: string; emoji: string }[] = [
  { value: 'christmas', label: 'Christmas', emoji: '🎄' },
  { value: 'easter', label: 'Easter', emoji: '🐣' },
  { value: 'summer-bbq', label: 'Summer BBQ', emoji: '🔥' },
  { value: 'general', label: 'General', emoji: '🏷️' },
];

export function DealForm({ initial, mode }: { initial?: Deal; mode: 'create' | 'edit' }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: (initial?.category ?? 'general') as DealCategory,
    imageUrl: initial?.imageUrl ?? '',
    badgeText: initial?.badgeText ?? '',
    status: (initial?.status ?? 'draft') as DealStatus,
    startsAt: initial?.startsAt ? new Date(initial.startsAt).toISOString().slice(0, 16) : '',
    endsAt: initial?.endsAt ? new Date(initial.endsAt).toISOString().slice(0, 16) : '',
    dealPrice: initial?.dealPrice ? String(((initial.dealPrice ?? 0) / 100).toFixed(2)) : '',
  });

  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [dealItems, setDealItems] = useState<DealItemState[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all products on mount, then hydrate dealItems for edit mode
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        const prods: ProductOption[] = (data.products ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          priceInPence: p.priceInPence,
          imageUrl: p.imageUrl ?? null,
          weightLabel: p.weightLabel ?? null,
          slug: p.slug,
        }));
        setAllProducts(prods);

        // Hydrate saved deal items from product list
        if (initial?.dealItems && initial.dealItems.length > 0) {
          const hydrated: DealItemState[] = [];
          for (const saved of initial.dealItems) {
            const prod = prods.find((p) => p.id === saved.productId);
            if (prod) hydrated.push({ ...prod, quantity: saved.quantity });
          }
          setDealItems(hydrated);
        }
      })
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts.slice(0, 12);
    const q = search.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [search, allProducts]);

  const alreadyAdded = new Set(dealItems.map((i) => i.id));

  function addItem(prod: ProductOption) {
    if (alreadyAdded.has(prod.id)) {
      setDealItems((prev) =>
        prev.map((i) => (i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setDealItems((prev) => [...prev, { ...prod, quantity: 1 }]);
    }
    setSearch('');
    setShowDropdown(false);
  }

  function updateQty(id: string, delta: number) {
    setDealItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
    );
  }

  function removeItem(id: string) {
    setDealItems((prev) => prev.filter((i) => i.id !== id));
  }

  const calculatedTotal = dealItems.reduce((s, i) => s + i.priceInPence * i.quantity, 0);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const dealPriceParsed = form.dealPrice
        ? Math.round(parseFloat(form.dealPrice) * 100)
        : null;

      const payload = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        imageUrl: form.imageUrl || null,
        badgeText: form.badgeText || null,
        status: form.status,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        dealItems: dealItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
        dealPrice: dealPriceParsed,
      };

      const url = mode === 'create' ? '/api/deals' : `/api/deals/${initial!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      router.push('/admin/deals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save deal');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Status banner */}
      <div className={`flex items-center justify-between gap-4 px-4 py-3 border ${
        form.status === 'published'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="text-sm font-medium">
          {form.status === 'published'
            ? '✓ This deal will be visible on the site'
            : '✏ Draft — not visible to customers yet'}
        </span>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, status: f.status === 'draft' ? 'published' : 'draft' }))}
          className="text-xs underline underline-offset-2 font-medium"
        >
          {form.status === 'draft' ? 'Publish' : 'Move to draft'}
        </button>
      </div>

      {/* Category */}
      <section>
        <Label>Season / category</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center gap-1 p-3 border cursor-pointer transition-colors ${
                form.category === opt.value
                  ? 'border-gold-500 bg-gold-400/10 text-ink-900'
                  : 'border-ink-900/10 hover:border-ink-900/30'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="category"
                value={opt.value}
                checked={form.category === opt.value}
                onChange={() => setForm({ ...form, category: opt.value })}
              />
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Title, badge & description */}
      <section className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Summer BBQ Bundle"
            required
          />
        </div>
        <div>
          <Label htmlFor="badge">Badge text (optional)</Label>
          <Input
            id="badge"
            value={form.badgeText}
            onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
            placeholder="Limited time · Save up to 20%"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Everything you need for the perfect BBQ — hand-selected by Gary."
          />
        </div>
      </section>

      {/* ── Bundle items ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-1">Bundle items</h2>
        <p className="text-xs text-ink-500 mb-4">
          Add products to this deal — customers can add the whole bundle to their cart in one click.
        </p>

        {/* Search / add */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2 border border-ink-900/15 px-3 focus-within:border-ink-900 bg-white">
            <Search className="h-4 w-4 text-ink-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search products to add…"
              className="flex-1 py-2.5 text-sm bg-transparent outline-none placeholder:text-ink-400"
            />
          </div>

          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-ink-900/15 shadow-lg max-h-64 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => addItem(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-cream-50 text-sm"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-9 h-9 object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 bg-ink-900/5 shrink-0" />
                  )}
                  <span className="flex-1 font-medium">{p.name}</span>
                  <span className="text-ink-500 tabular shrink-0">{formatPrice(p.priceInPence)}</span>
                  {alreadyAdded.has(p.id) && (
                    <span className="text-[10px] uppercase tracking-wider text-gold-600 shrink-0">added</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items list */}
        {dealItems.length > 0 ? (
          <div className="border border-ink-900/10 divide-y divide-ink-900/8">
            {dealItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-ink-900/5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.weightLabel && (
                    <p className="text-xs text-ink-500">{item.weightLabel}</p>
                  )}
                </div>
                {/* Quantity stepper */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="h-7 w-7 flex items-center justify-center border border-ink-900/15 hover:border-ink-900 text-ink-700"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm tabular">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    className="h-7 w-7 flex items-center justify-center border border-ink-900/15 hover:border-ink-900 text-ink-700"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm tabular text-ink-700 shrink-0">
                  {formatPrice(item.priceInPence * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="h-7 w-7 flex items-center justify-center text-ink-400 hover:text-butcher-600 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-cream-50">
              <span className="text-sm text-ink-500">Calculated total</span>
              <span className="text-sm font-semibold tabular">{formatPrice(calculatedTotal)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-400 border border-dashed border-ink-900/15 py-6 text-center">
            No items added yet — search above to build the bundle.
          </p>
        )}

        {/* Optional deal price override */}
        {dealItems.length > 0 && (
          <div className="mt-4">
            <Label htmlFor="dealPrice">
              Special deal price (optional — leave blank to use the calculated total)
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-ink-500 text-sm">£</span>
              <Input
                id="dealPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.dealPrice}
                onChange={(e) => setForm({ ...form, dealPrice: e.target.value })}
                placeholder={((calculatedTotal) / 100).toFixed(2)}
                className="max-w-[140px]"
              />
            </div>
            <p className="text-xs text-ink-500 mt-1">
              Set a lower price to offer a bundle discount.
            </p>
          </div>
        )}
      </section>

      {/* Image */}
      <section>
        <Label>Banner image (optional)</Label>
        <div className="flex items-start gap-5 mt-2">
          {form.imageUrl ? (
            <div className="relative h-24 w-40 bg-ink-900/5 border border-ink-900/10 overflow-hidden shrink-0">
              <Image src={form.imageUrl} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                className="absolute top-1 right-1 h-6 w-6 bg-ink-900/80 text-cream-50 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="h-24 w-40 bg-ink-900/5 border border-ink-900/10 flex items-center justify-center text-ink-400 text-xs shrink-0">
              No image
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleUpload}
              className="hidden"
              id="deal-image-upload"
            />
            <label htmlFor="deal-image-upload">
              <span className="inline-flex items-center gap-2 px-4 h-10 border border-ink-900/15 hover:border-ink-900 text-sm cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload image'}
              </span>
            </label>
            <p className="text-xs text-ink-500 mt-2">Landscape images work best · max 5MB</p>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Schedule (optional)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="starts">Show from</Label>
            <Input
              id="starts"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ends">Hide after</Label>
            <Input
              id="ends"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Leave blank to show immediately on publish with no expiry.
        </p>
      </section>

      {error && (
        <p className="text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-ink-900/10 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/deals')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Save deal' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
