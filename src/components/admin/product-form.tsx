'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Category, Product } from '@/lib/db/schema';

type FormProduct = Partial<Product> & {
  packContents?: string[];
  galleryUrls?: string[];
};

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
    priceInPence: initial?.priceInPence ?? 0,
    compareAtPriceInPence: initial?.compareAtPriceInPence ?? 0,
    weightLabel: initial?.weightLabel ?? '',
    badge: initial?.badge ?? '',
    imageUrl: initial?.imageUrl ?? '',
    isPack: initial?.isPack ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
  });
  const [packContents, setPackContents] = useState<string[]>(
    initial?.packContents ?? []
  );
  const [packLine, setPackLine] = useState('');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function priceInputToPence(v: string) {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  }

  function penceToInput(p: number) {
    return (p / 100).toFixed(2);
  }

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
    setSubmitting(true);
    try {
      const payload = {
        categoryId: form.categoryId || null,
        name: form.name,
        description: form.description || null,
        priceInPence: form.priceInPence,
        compareAtPriceInPence:
          form.compareAtPriceInPence > 0 ? form.compareAtPriceInPence : null,
        imageUrl: form.imageUrl || null,
        weightLabel: form.weightLabel || null,
        badge: form.badge || null,
        isPack: form.isPack,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        packContents: form.isPack ? packContents : [],
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
            <Label htmlFor="price">Price (£)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={penceToInput(form.priceInPence)}
              onChange={(e) =>
                setForm({ ...form, priceInPence: priceInputToPence(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="compare">Compare-at (£, optional)</Label>
            <Input
              id="compare"
              type="number"
              step="0.01"
              min="0"
              value={penceToInput(form.compareAtPriceInPence ?? 0)}
              onChange={(e) =>
                setForm({
                  ...form,
                  compareAtPriceInPence: priceInputToPence(e.target.value),
                })
              }
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
      </section>

      {/* Type & flags */}
      <section>
        <h2 className="font-display text-xl text-ink-900 mb-4">Settings</h2>
        <div className="space-y-3">
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