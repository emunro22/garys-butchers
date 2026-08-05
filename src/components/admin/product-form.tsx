'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Category, Product } from '@/lib/db/schema';
import { formatPrice, percentOff } from '@/lib/utils';
import { NOTICE_OPTIONS } from '@/lib/notice';

type Variant = {
  label: string;
  priceInPence: number;
  compareAtPriceInPence?: number;
};

type FormProduct = Partial<Product> & {
  packContents?: string[];
  galleryUrls?: string[];
  variants?: Variant[];
  marinades?: string[];
};

const PRESET_SIZES = ['4oz', '6oz', '7oz', '8oz', '10oz', '12oz', '14oz', '16oz / 1lb', 'Custom'];

const PRESET_MARINADES = [
  'Peri Peri', 'Lemon & Herb', 'BBQ', 'Cajun', 'Garlic & Herb', 'Tikka', 'Plain', 'Custom',
];

// £, no reformatting — used only for the initial value on mount, never fed
// back into a controlled input's `value` on every keystroke (that's what
// made the price fields impossible to edit before).
function penceToStr(p: number): string {
  return p > 0 ? (p / 100).toFixed(2) : '';
}

function strToPence(s: string): number {
  const n = Math.round(Number(s) * 100);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function ProductForm({
  initial,
  categories,
  mode,
}: {
  initial?: FormProduct;
  categories: Category[];
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    categoryId: initial?.categoryId ?? '',
    description: initial?.description ?? '',
    weightLabel: initial?.weightLabel ?? '',
    badge: initial?.badge ?? '',
    cookingTips: initial?.cookingTips ?? '',
    ingredients: initial?.ingredients ?? '',
    allergyInfo: initial?.allergyInfo ?? '',
    nutritionInfo: initial?.nutritionInfo ?? '',
    imageUrl: initial?.imageUrl ?? '',
    isPack: initial?.isPack ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
    isSubscribable: initial?.isSubscribable ?? false,
    noticeDays: initial?.noticeDays ?? 0,
  });

  // --- Base price: current price + optional discounted price ---
  // Stored as the raw text the admin typed, not derived from a formatted
  // number every render, so the field never fights their cursor.
  const initialHasDiscount = !!(
    initial?.compareAtPriceInPence && initial.compareAtPriceInPence > (initial?.priceInPence ?? 0)
  );
  const [currentPriceInput, setCurrentPriceInput] = useState(
    initialHasDiscount ? penceToStr(initial!.compareAtPriceInPence!) : penceToStr(initial?.priceInPence ?? 0)
  );
  const [discountedPriceInput, setDiscountedPriceInput] = useState(
    initialHasDiscount ? penceToStr(initial!.priceInPence!) : ''
  );
  const currentPriceInPence = strToPence(currentPriceInput);
  const discountedPriceInPence = discountedPriceInput.trim() ? strToPence(discountedPriceInput) : 0;
  const hasDiscount = discountedPriceInPence > 0 && discountedPriceInPence < currentPriceInPence;

  const [packContents, setPackContents] = useState<string[]>(
    initial?.packContents ?? []
  );
  const [packLine, setPackLine] = useState('');

  const [variants, setVariants] = useState<Variant[]>(
    (initial?.variants as Variant[] | undefined) ?? []
  );
  const [newSize, setNewSize] = useState('7oz');
  const [customSize, setCustomSize] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDiscountedPrice, setNewDiscountedPrice] = useState('');

  function addVariant() {
    const label = (newSize === 'Custom' ? customSize : newSize).trim();
    const current = strToPence(newPrice);
    if (!label || current <= 0) return;
    if (variants.some((v) => v.label === label)) return; // no duplicates
    const discounted = newDiscountedPrice.trim() ? strToPence(newDiscountedPrice) : 0;
    const discountActive = discounted > 0 && discounted < current;
    setVariants((v) => [...v, {
      label,
      priceInPence: discountActive ? discounted : current,
      compareAtPriceInPence: discountActive ? current : undefined,
    }]);
    setNewPrice('');
    setNewDiscountedPrice('');
    if (newSize === 'Custom') setCustomSize('');
  }

  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  function updateVariantCurrentPrice(i: number, raw: string) {
    const current = strToPence(raw);
    if (current <= 0) return;
    setVariants((v) => v.map((item, idx) => {
      if (idx !== i) return item;
      const discounted = item.compareAtPriceInPence ? item.priceInPence : 0;
      const discountActive = discounted > 0 && discounted < current;
      return {
        ...item,
        priceInPence: discountActive ? discounted : current,
        compareAtPriceInPence: discountActive ? current : undefined,
      };
    }));
  }

  function updateVariantDiscountedPrice(i: number, raw: string) {
    setVariants((v) => v.map((item, idx) => {
      if (idx !== i) return item;
      const current = item.compareAtPriceInPence ?? item.priceInPence;
      if (!raw.trim()) {
        return { ...item, priceInPence: current, compareAtPriceInPence: undefined };
      }
      const discounted = strToPence(raw);
      const discountActive = discounted > 0 && discounted < current;
      return {
        ...item,
        priceInPence: discountActive ? discounted : current,
        compareAtPriceInPence: discountActive ? current : undefined,
      };
    }));
  }

  function moveVariant(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= variants.length) return;
    setVariants((v) => {
      const next = [...v];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const [marinades, setMarinades] = useState<string[]>(initial?.marinades ?? []);
  const [newMarinade, setNewMarinade] = useState('Peri Peri');
  const [customMarinade, setCustomMarinade] = useState('');

  function addMarinade() {
    const label = (newMarinade === 'Custom' ? customMarinade : newMarinade).trim();
    if (!label || marinades.includes(label)) return;
    setMarinades((m) => [...m, label]);
    if (newMarinade === 'Custom') setCustomMarinade('');
  }

  function removeMarinade(i: number) {
    setMarinades((m) => m.filter((_, idx) => idx !== i));
  }

  function moveMarinade(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= marinades.length) return;
    setMarinades((m) => {
      const next = [...m];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
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

  function addPackLine() {
    if (!packLine.trim()) return;
    setPackContents((arr) => [...arr, packLine.trim()]);
    setPackLine('');
  }

  function removePackLine(i: number) {
    setPackContents((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (currentPriceInPence <= 0) {
      setError('Enter a current price');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        categoryId: form.categoryId || null,
        name: form.name,
        description: form.description || null,
        priceInPence: hasDiscount ? discountedPriceInPence : currentPriceInPence,
        compareAtPriceInPence: hasDiscount ? currentPriceInPence : null,
        imageUrl: form.imageUrl || null,
        weightLabel: form.weightLabel || null,
        badge: form.badge || null,
        cookingTips: form.cookingTips || null,
        ingredients: form.ingredients || null,
        allergyInfo: form.allergyInfo || null,
        nutritionInfo: form.nutritionInfo || null,
        isPack: form.isPack,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        isSubscribable: form.isSubscribable,
        noticeDays: form.noticeDays,
        packContents: form.isPack ? packContents : [],
        variants,
        marinades,
      };
      const url = mode === 'create' ? '/api/products' : `/api/products/${initial!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-3xl">
      {/* Image */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Image</h2>
        <div className="flex items-start gap-5">
          <div className="relative h-32 w-32 bg-ink-900/5 border border-ink-900/10 overflow-hidden shrink-0">
            {form.imageUrl ? (
              <>
                <Image src={form.imageUrl} alt="" fill sizes="128px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute top-1 right-1 h-6 w-6 bg-ink-900/80 text-cream-50 flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-xs">
                No image
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <span className="inline-flex items-center gap-2 px-4 h-10 border border-ink-900/15 hover:border-ink-900 text-sm cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload image'}
              </span>
            </label>
            <p className="text-xs text-ink-500 mt-2">
              JPEG, PNG, WebP or AVIF · max 5MB · roughly square works best
            </p>
            {form.imageUrl && (
              <p className="text-xs text-ink-500 mt-1 truncate">{form.imageUrl}</p>
            )}
          </div>
        </div>
      </section>

      {/* Basic fields */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ingredients">Ingredients (optional)</Label>
            <Textarea
              id="ingredients"
              rows={3}
              placeholder="e.g. Pork, salt, black pepper, sage, rusk (wheat)"
              value={form.ingredients ?? ''}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="allergyInfo">Allergy information (optional)</Label>
            <Textarea
              id="allergyInfo"
              rows={3}
              placeholder="e.g. Contains gluten, sulphites. May contain traces of nuts."
              value={form.allergyInfo ?? ''}
              onChange={(e) => setForm({ ...form, allergyInfo: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cookingTips">Cooking tips (optional)</Label>
            <Textarea
              id="cookingTips"
              rows={3}
              placeholder="e.g. Grill or fry over medium heat for 15-18 mins, turning occasionally."
              value={form.cookingTips ?? ''}
              onChange={(e) => setForm({ ...form, cookingTips: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="nutritionInfo">Nutritional information (optional)</Label>
            <Textarea
              id="nutritionInfo"
              rows={3}
              placeholder="e.g. Typical values per 100g: Energy 250kcal, Fat 15g, Protein 20g, Carbohydrate 2g"
              value={form.nutritionInfo ?? ''}
              onChange={(e) => setForm({ ...form, nutritionInfo: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="badge">Badge (optional)</Label>
              <Input
                id="badge"
                placeholder="Bestseller, New, Limited"
                value={form.badge ?? ''}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Price */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Price</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Current price (£)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={currentPriceInput}
              onChange={(e) => setCurrentPriceInput(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="discountedPrice">Discounted price (£, optional)</Label>
            <Input
              id="discountedPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Leave blank for no discount"
              value={discountedPriceInput}
              onChange={(e) => setDiscountedPriceInput(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight label</Label>
            <Input
              id="weight"
              placeholder="approx 500g"
              value={form.weightLabel ?? ''}
              onChange={(e) => setForm({ ...form, weightLabel: e.target.value })}
            />
          </div>
        </div>
        {discountedPriceInput.trim() && (
          hasDiscount ? (
            <div className="mt-4 flex items-center gap-3 border border-ink-900/10 bg-cream-50 px-4 py-3">
              <span className="text-sm text-ink-400 line-through tabular">
                {formatPrice(currentPriceInPence)}
              </span>
              <span className="text-base font-medium text-ink-900 tabular">
                {formatPrice(discountedPriceInPence)}
              </span>
              <span className="text-xs uppercase tracking-[0.15em] font-semibold text-butcher-500 bg-butcher-500/10 px-2 py-1">
                Save {percentOff(discountedPriceInPence, currentPriceInPence)}%
              </span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-butcher-500">
              Discounted price should be lower than the current price for the saving to show on the shop.
            </p>
          )
        )}
      </section>

      {/* Type & flags */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Settings</h2>
        <div className="space-y-3">
          <div className="p-3 border border-ink-900/10">
            <Label htmlFor="noticeDays">Order notice</Label>
            <select
              id="noticeDays"
              value={form.noticeDays}
              onChange={(e) => setForm({ ...form, noticeDays: Number(e.target.value) })}
              className="w-full border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm mt-1"
            >
              {NOTICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-500 mt-2">
              How much extra advance notice this product needs beyond the normal earliest slot. Shown to customers and enforced at checkout.
            </p>
          </div>
          <Toggle
            checked={form.isPack}
            onChange={(v) => setForm({ ...form, isPack: v })}
            label="This is a meat pack"
            hint="Packs use a different layout and show their contents on the product page."
          />
          <Toggle
            checked={form.isFeatured}
            onChange={(v) => setForm({ ...form, isFeatured: v })}
            label="Featured on the homepage"
          />
          <Toggle
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            label="Active (visible in shop)"
          />
          <Toggle
            checked={form.isSubscribable}
            onChange={(v) => setForm({ ...form, isSubscribable: v })}
            label="Available in build-your-own subscriptions"
            hint="Lets customers add this to a recurring monthly subscription. Only turn this on for staple items, not day-fresh stock."
          />
        </div>
      </section>

      {/* Pack contents */}
      {form.isPack && (
        <section>
          <h2 className="font-display text-xl text-ink-900 mb-4">Pack contents</h2>
          <div className="space-y-2 mb-4">
            {packContents.length === 0 && (
              <p className="text-sm text-ink-500 italic">No items yet — add what&apos;s in the pack below.</p>
            )}
            {packContents.map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-cream-100 border border-ink-900/10 px-3 py-2"
              >
                <span className="text-gold-500 text-xs">●</span>
                <span className="flex-1 text-sm">{line}</span>
                <button
                  type="button"
                  onClick={() => removePackLine(i)}
                  className="text-ink-400 hover:text-butcher-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 2lb Pork Sausages"
              value={packLine}
              onChange={(e) => setPackLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPackLine();
                }
              }}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addPackLine}>
              <Plus className="h-4 w-4 mr-1" /> Add line
            </Button>
          </div>
        </section>
      )}

      {/* Variants */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-1">Size variants</h2>
        <p className="text-xs text-ink-500 mb-5">
          When variants are added, customers pick a size from a dropdown on the product page — each
          size has its own current price and, optionally, its own discounted price. Leave empty to
          use the base price above.
        </p>

        {/* Existing variants */}
        {variants.length > 0 && (
          <div className="mb-5 border border-ink-900/10 divide-y divide-ink-900/10">
            <div className="grid grid-cols-[1fr_110px_110px_72px] bg-cream-100 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-ink-500">
              <span>Size</span>
              <span>Current (£)</span>
              <span>Discounted (£)</span>
              <span />
            </div>
            {variants.map((v, i) => {
              const currentPrice = v.compareAtPriceInPence ?? v.priceInPence;
              const discounted = v.compareAtPriceInPence ? v.priceInPence : null;
              return (
                <div key={i} className="grid grid-cols-[1fr_110px_110px_72px] items-center px-3 py-2 bg-cream-50">
                  <div>
                    <span className="text-sm font-medium text-ink-900">{v.label}</span>
                    {discounted && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.1em] font-semibold text-butcher-500 bg-butcher-500/10 px-1.5 py-0.5">
                        Save {percentOff(discounted, currentPrice)}%
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(currentPrice / 100).toFixed(2)}
                    onBlur={(e) => updateVariantCurrentPrice(i, e.target.value)}
                    className="w-24 border border-ink-900/15 bg-cream-50 px-2 h-8 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="—"
                    defaultValue={discounted ? (discounted / 100).toFixed(2) : ''}
                    onBlur={(e) => updateVariantDiscountedPrice(i, e.target.value)}
                    className="w-24 border border-ink-900/15 bg-cream-50 px-2 h-8 text-sm"
                  />
                  <div className="flex items-center gap-0.5 justify-end">
                    <button
                      type="button"
                      onClick={() => moveVariant(i, -1)}
                      disabled={i === 0}
                      className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-20"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVariant(i, 1)}
                      disabled={i === variants.length - 1}
                      className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-20"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-1 text-ink-400 hover:text-butcher-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new variant */}
        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-500 mb-3">Add a size</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Size</label>
              <select
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
              >
                {PRESET_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {newSize === 'Custom' && (
              <div>
                <label className="block text-xs text-ink-500 mb-1">Custom label</label>
                <Input
                  placeholder="e.g. 500g"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                  className="w-32"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-ink-500 mb-1">Current price (£)</label>
              <Input
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                className="w-28"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-1">Discounted (£, optional)</label>
              <Input
                placeholder="—"
                type="number"
                step="0.01"
                min="0"
                value={newDiscountedPrice}
                onChange={(e) => setNewDiscountedPrice(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                className="w-28"
              />
            </div>

            <Button type="button" variant="outline" onClick={addVariant} className="h-11">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </section>

      {/* Marinades */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-1">Marinade options</h2>
        <p className="text-xs text-ink-500 mb-5">
          Add one or more marinades to give this product a &quot;Choose marinade&quot; dropdown on
          its product page — this is how you grant the dropdown to specific products (e.g. chicken
          strips, chicken breasts). Leave empty for no dropdown.
        </p>

        {marinades.length > 0 && (
          <div className="mb-5 border border-ink-900/10 divide-y divide-ink-900/10">
            {marinades.map((label, i) => (
              <div key={label} className="flex items-center justify-between px-3 py-2 bg-cream-50">
                <span className="text-sm font-medium text-ink-900">{label}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveMarinade(i, -1)}
                    disabled={i === 0}
                    className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMarinade(i, 1)}
                    disabled={i === marinades.length - 1}
                    className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-20"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMarinade(i)}
                    className="p-1 text-ink-400 hover:text-butcher-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-cream-100 border border-ink-900/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-500 mb-3">Add a marinade</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Marinade</label>
              <select
                value={newMarinade}
                onChange={(e) => setNewMarinade(e.target.value)}
                className="border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
              >
                {PRESET_MARINADES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {newMarinade === 'Custom' && (
              <div>
                <label className="block text-xs text-ink-500 mb-1">Custom label</label>
                <Input
                  placeholder="e.g. Smoky Chipotle"
                  value={customMarinade}
                  onChange={(e) => setCustomMarinade(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMarinade(); } }}
                  className="w-40"
                />
              </div>
            )}

            <Button type="button" variant="outline" onClick={addMarinade} className="h-11">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-ink-900/10 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-4 p-3 border border-ink-900/10 cursor-pointer hover:bg-cream-100">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 mt-0.5 h-6 w-11 relative rounded-full transition-colors ${
          checked ? 'bg-gold-500' : 'bg-ink-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 bg-cream-50 rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-ink-900 block">{label}</span>
        {hint && <span className="text-xs text-ink-500 block mt-0.5">{hint}</span>}
      </div>
    </label>
  );
}
