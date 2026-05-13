'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Category } from '@/lib/db/schema';

export function CategoryForm({
  initial,
  mode,
}: {
  initial?: Partial<Category> & { id?: string };
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };
      if (form.slug.trim()) payload.slug = form.slug.trim().toLowerCase();

      const url = mode === 'create' ? '/api/categories' : `/api/categories/${initial!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      router.push('/admin/categories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
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
        <Label htmlFor="slug">URL slug (optional — auto-generated from name)</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="beef, pork, chicken…"
          className="font-mono"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Hand-cut Scottish beef…"
        />
      </div>

      <div>
        <Label htmlFor="sort">Sort order</Label>
        <Input
          id="sort"
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          className="max-w-[120px]"
        />
        <p className="text-xs text-ink-500 mt-1">Lower numbers appear first in menus.</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="h-4 w-4 accent-gold-500"
        />
        <span className="text-sm text-ink-900 font-medium">Active (visible in shop)</span>
      </label>

      {error && (
        <p className="text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-ink-900/10 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/categories')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create category' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}