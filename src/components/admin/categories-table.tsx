'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/db/schema';

export function CategoriesTable({
  categories,
  countMap,
}: {
  categories: Category[];
  countMap: Record<string, number>;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    const count = countMap[id] ?? 0;
    if (count > 0) {
      alert(
        `Can't delete "${name}" — ${count} product${count === 1 ? '' : 's'} still in this category. Move or delete them first.`
      );
      return;
    }
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete that category.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-cream-100 border border-ink-900/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 truncate">{c.name}</p>
                <p className="text-xs text-ink-500 mt-0.5 font-mono">{c.slug}</p>
                {c.description && (
                  <p className="text-xs text-ink-700 mt-2 line-clamp-2">{c.description}</p>
                )}
              </div>
              <span
                className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                  c.isActive ? 'bg-green-500' : 'bg-ink-300'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-900/5">
              <p className="text-xs text-ink-500">
                {countMap[c.id] ?? 0} product{(countMap[c.id] ?? 0) === 1 ? '' : 's'} · order {c.sortOrder}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] bg-ink-900 text-cream-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  disabled={deleting === c.id}
                  className="px-2 py-1.5 border border-butcher-500/30 text-butcher-500 hover:bg-butcher-500/5 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-cream-100 border border-ink-900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-ink-900/10">
            <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
              <th className="px-5 py-3 w-16">Order</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right">Products</th>
              <th className="px-5 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-cream-50">
                <td className="px-5 py-3 tabular text-ink-500">{c.sortOrder}</td>
                <td className="px-5 py-3 font-medium text-ink-900">{c.name}</td>
                <td className="px-5 py-3 text-ink-500 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-ink-700 max-w-md truncate">
                  {c.description ?? '—'}
                </td>
                <td className="px-5 py-3 text-right tabular">{countMap[c.id] ?? 0}</td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      c.isActive ? 'bg-green-500' : 'bg-ink-300'
                    }`}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="p-2 hover:bg-ink-900/5 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deleting === c.id}
                      className="p-2 hover:bg-butcher-500/10 hover:text-butcher-500 transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}