'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
    imageUrl: initial?.imageUrl ?? '',
  });
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
        imageUrl: form.imageUrl || null,
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
        <Label>Image</Label>
        <p className="text-xs text-ink-500 mb-2">
          Shown on the homepage and shop category grid. If left blank, a product image from
          this category is used instead.
        </p>
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
              id="category-image-upload"
            />
            <label htmlFor="category-image-upload">
              <span className="inline-flex items-center gap-2 px-4 h-10 border border-ink-900/15 hover:border-ink-900 text-sm cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload image'}
              </span>
            </label>
            <p className="text-xs text-ink-500 mt-2">
              JPEG, PNG, WebP or AVIF · max 5MB · roughly 4:3 works best
            </p>
          </div>
        </div>
      </div>

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
        <Label htmlFor="slug">URL slug (optional, auto-generated from name)</Label>
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