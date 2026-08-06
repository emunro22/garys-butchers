'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Promotion } from '@/lib/db/schema';

type PromoType = 'percent_off' | 'amount_off' | 'free_delivery';

function toLocalDateTimeInput(value: string | Date | null) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromotionForm({
  initial,
  products,
}: {
  initial?: Promotion;
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    description: initial?.description ?? '',
    type: (initial?.type ?? 'percent_off') as PromoType,
    value: initial?.value ?? 10,
    minimumOrderInPence: initial?.minimumOrderInPence ?? 0,
    maxRedemptions: (initial?.maxRedemptions ?? '') as '' | number,
    startsAt: toLocalDateTimeInput(initial?.startsAt ?? null),
    endsAt: toLocalDateTimeInput(initial?.endsAt ?? null),
    isActive: initial?.isActive ?? true,
    productIds: initial?.productIds ?? ([] as string[]),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.trim().toLowerCase())
  );

  function priceToPence(v: string) {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : Math.round(n * 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        description: form.description || null,
        type: form.type,
        value:
          form.type === 'amount_off'
            ? Number(form.value) // already pence (input controlled below)
            : form.type === 'percent_off'
              ? Number(form.value)
              : 0,
        minimumOrderInPence: form.minimumOrderInPence,
        maxRedemptions:
          form.maxRedemptions === '' || form.maxRedemptions === 0
            ? null
            : Number(form.maxRedemptions),
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        isActive: form.isActive,
        productIds: form.productIds,
      };
      const res = await fetch(isEdit ? `/api/promotions/${initial!.id}` : '/api/promotions', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Could not ${isEdit ? 'update' : 'create'} promotion`);
      router.push('/admin/promotions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${isEdit ? 'update' : 'create'} promotion`);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <section>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              required
              className="font-mono uppercase"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as PromoType,
                  value: e.target.value === 'percent_off' ? 10 : 0,
                })
              }
              className="w-full border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
            >
              <option value="percent_off">Percent off</option>
              <option value="amount_off">Fixed amount off</option>
              <option value="free_delivery">Free delivery</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="targetProducts">Applies to</Label>
          <Input
            id="targetProducts"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products…"
            className="mb-2"
          />
          <div className="border border-ink-900/15 bg-cream-50 max-h-56 overflow-y-auto divide-y divide-ink-900/10">
            {!productSearch && (
              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-cream-100">
                <input
                  type="checkbox"
                  checked={form.productIds.length === 0}
                  onChange={() => setForm({ ...form, productIds: [] })}
                  className="h-4 w-4 accent-gold-500"
                />
                <span className="text-sm text-ink-900">Store-wide (any order)</span>
              </label>
            )}
            {filteredProducts.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-cream-100"
              >
                <input
                  type="checkbox"
                  checked={form.productIds.includes(p.id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productIds: e.target.checked
                        ? [...form.productIds, p.id]
                        : form.productIds.filter((id) => id !== p.id),
                    })
                  }
                  className="h-4 w-4 accent-gold-500"
                />
                <span className="text-sm text-ink-900">{p.name}</span>
              </label>
            ))}
            {productSearch && filteredProducts.length === 0 && (
              <p className="px-3 py-2 text-sm text-ink-500">No products match "{productSearch}"</p>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-2">
            {form.productIds.length > 0
              ? `${form.productIds.length} product${form.productIds.length === 1 ? '' : 's'} selected — this code only works if one of them is in the customer's basket, and the discount only applies to those products' lines — not the rest of the order.`
              : 'Applies to the whole order (minus meat packs, which already have bundled pricing).'}
          </p>
        </div>

        <div className="mt-4">
          <Label htmlFor="description">Description (shown to customers in cart)</Label>
          <Textarea
            id="description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="10% off your first order"
          />
        </div>
      </section>

      {/* Value */}
      {form.type !== 'free_delivery' && (
        <section>
          <div className="grid sm:grid-cols-2 gap-4">
            {form.type === 'percent_off' ? (
              <div>
                <Label htmlFor="value">Percent off (1–100)</Label>
                <Input
                  id="value"
                  type="number"
                  min="1"
                  max="100"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="value">Amount off (£)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(form.value / 100).toFixed(2)}
                  onChange={(e) =>
                    setForm({ ...form, value: priceToPence(e.target.value) })
                  }
                />
              </div>
            )}
            <div>
              <Label htmlFor="min">Minimum order (£)</Label>
              <Input
                id="min"
                type="number"
                step="0.01"
                min="0"
                value={(form.minimumOrderInPence / 100).toFixed(2)}
                onChange={(e) =>
                  setForm({ ...form, minimumOrderInPence: priceToPence(e.target.value) })
                }
              />
            </div>
          </div>
        </section>
      )}

      {/* Limits */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="max">Max redemptions</Label>
          <Input
            id="max"
            type="number"
            min="0"
            placeholder="unlimited"
            value={form.maxRedemptions}
            onChange={(e) =>
              setForm({
                ...form,
                maxRedemptions:
                  e.target.value === '' ? '' : Number(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="starts">Starts</Label>
          <Input
            id="starts"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ends">Expires</Label>
          <Input
            id="ends"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </div>
      </section>

      <section>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 accent-gold-500"
          />
          <span className="text-sm text-ink-900 font-medium">Active</span>
        </label>
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
          onClick={() => router.push('/admin/promotions')}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create code'}
        </Button>
      </div>
    </form>
  );
}
