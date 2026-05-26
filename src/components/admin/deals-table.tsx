'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Deal } from '@/lib/db/schema';

const CATEGORY_EMOJI: Record<string, string> = {
  christmas: '🎄',
  easter: '🐣',
  'summer-bbq': '🔥',
  general: '🏷️',
};

export function DealsTable({ initial }: { initial: Deal[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleStatus(d: Deal) {
    setBusy(d.id);
    const newStatus = d.status === 'draft' ? 'published' : 'draft';
    try {
      const res = await fetch(`/api/deals/${d.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRows((r) => r.map((x) => (x.id === d.id ? { ...x, status: newStatus } : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteDeal(d: Deal) {
    if (!confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
    setBusy(d.id);
    try {
      const res = await fetch(`/api/deals/${d.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== d.id));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-cream-100 border border-ink-900/10 py-16 text-center">
        <p className="font-display text-2xl text-ink-700 mb-2">No deals yet</p>
        <p className="text-sm text-ink-500">Create your first seasonal deal — it'll be saved as draft until you publish it.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rows.map((d) => (
        <div
          key={d.id}
          className={`flex gap-4 border p-4 transition-opacity ${
            busy === d.id ? 'opacity-50' : ''
          } ${d.status === 'published' ? 'border-green-200 bg-green-50/30' : 'border-ink-900/10 bg-cream-100'}`}
        >
          {/* Thumbnail */}
          <div className="shrink-0 w-20 h-16 bg-ink-900/5 border border-ink-900/10 overflow-hidden">
            {d.imageUrl ? (
              <Image src={d.imageUrl} alt="" width={80} height={64} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {CATEGORY_EMOJI[d.category] ?? '🏷️'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-medium text-ink-900 truncate">{d.title}</span>
              <span className="text-xs">{CATEGORY_EMOJI[d.category]}</span>
              <span
                className={`text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 font-semibold ${
                  d.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {d.status}
              </span>
            </div>
            {d.description && (
              <p className="text-sm text-ink-500 mt-1 line-clamp-1">{d.description}</p>
            )}
            {(d.startsAt || d.endsAt) && (
              <p className="text-xs text-ink-400 mt-1">
                {d.startsAt && `From ${new Date(d.startsAt).toLocaleDateString('en-GB')}`}
                {d.startsAt && d.endsAt && ' · '}
                {d.endsAt && `Until ${new Date(d.endsAt).toLocaleDateString('en-GB')}`}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => toggleStatus(d)}
              disabled={busy === d.id}
              title={d.status === 'draft' ? 'Publish' : 'Move to draft'}
              className="h-9 w-9 flex items-center justify-center border border-ink-900/10 hover:border-ink-900 text-ink-500 hover:text-ink-900 transition-colors disabled:opacity-40"
            >
              {d.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <Link
              href={`/admin/deals/${d.id}`}
              className="h-9 w-9 flex items-center justify-center border border-ink-900/10 hover:border-ink-900 text-ink-500 hover:text-ink-900 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => deleteDeal(d)}
              disabled={busy === d.id}
              title="Delete"
              className="h-9 w-9 flex items-center justify-center border border-ink-900/10 hover:border-butcher-500 text-ink-500 hover:text-butcher-500 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
