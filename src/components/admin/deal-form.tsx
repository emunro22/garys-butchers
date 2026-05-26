'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import type { Deal } from '@/lib/db/schema';

type DealCategory = 'christmas' | 'easter' | 'summer-bbq' | 'general';
type DealStatus = 'draft' | 'published';

const CATEGORY_OPTIONS: { value: DealCategory; label: string; emoji: string }[] = [
  { value: 'christmas', label: 'Christmas', emoji: '🎄' },
  { value: 'easter', label: 'Easter', emoji: '🐣' },
  { value: 'summer-bbq', label: 'Summer BBQ', emoji: '🔥' },
  { value: 'general', label: 'General', emoji: '🏷️' },
];

export function DealForm({
  initial,
  mode,
}: {
  initial?: Deal;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: (initial?.category ?? 'general') as DealCategory,
    imageUrl: initial?.imageUrl ?? '',
    badgeText: initial?.badgeText ?? '',
    status: (initial?.status ?? 'draft') as DealStatus,
    startsAt: initial?.startsAt
      ? new Date(initial.startsAt).toISOString().slice(0, 16)
      : '',
    endsAt: initial?.endsAt
      ? new Date(initial.endsAt).toISOString().slice(0, 16)
      : '',
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
      const payload = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        imageUrl: form.imageUrl || null,
        badgeText: form.badgeText || null,
        status: form.status,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
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
          {form.status === 'published' ? '✓ This deal will be visible on the site' : '✏ Draft — not visible to customers yet'}
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

      {/* Title & badge */}
      <section className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Christmas Feast Packs"
            required
          />
        </div>
        <div>
          <Label htmlFor="badge">Badge text (optional — shown as a pill on the banner)</Label>
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
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Stock the freezer before the big day. Our Christmas packs are the same great value as always — just bigger."
          />
        </div>
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
