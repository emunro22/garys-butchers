'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/lib/db/schema';

export function ProductsTable({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [type, setType] = useState<'all' | 'pack' | 'single'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (type === 'pack' && !p.isPack) return false;
      if (type === 'single' && p.isPack) return false;
      return true;
    });
  }, [products, query, categoryId, type]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err) {
      alert('Could not delete that product.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-cream-100 border border-ink-900/10 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'all' | 'pack' | 'single')}
          className="border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm"
        >
          <option value="all">All types</option>
          <option value="single">Single items</option>
          <option value="pack">Meat packs</option>
        </select>
      </div>

{/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-ink-500">No products match those filters.</p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-cream-100 border border-ink-900/10 p-3 flex gap-3 items-center"
          >
            <div className="relative h-14 w-14 bg-ink-900/5 overflow-hidden shrink-0">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-ink-300 text-xs">
                  ·
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink-900 leading-tight truncate">{p.name}</p>
                <span
                  className={`inline-block h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                    p.isActive ? 'bg-green-500' : 'bg-ink-300'
                  }`}
                  title={p.isActive ? 'Active' : 'Inactive'}
                />
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-xs text-ink-500 truncate">
                  {p.categoryId ? catMap.get(p.categoryId)?.name ?? '—' : '—'}
                  {p.isPack && ' · Pack'}
                </p>
                <p className="text-sm font-medium text-ink-900 tabular shrink-0">
                  {formatPrice(p.priceInPence)}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex-1 text-center text-xs uppercase tracking-[0.18em] py-2 bg-ink-900 text-cream-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  disabled={deleting === p.id}
                  className="px-3 py-2 border border-butcher-500/30 text-butcher-500 hover:bg-butcher-500/5 text-xs uppercase tracking-[0.18em] disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
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
              <th className="px-5 py-3 w-16">Image</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                  No products match those filters.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50">
                <td className="px-5 py-3">
                  <div className="relative h-10 w-10 bg-ink-900/5 overflow-hidden">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-xs">
                        ·
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-900">{p.name}</div>
                  {p.weightLabel && (
                    <div className="text-xs text-ink-500">{p.weightLabel}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-700">
                  {p.categoryId ? catMap.get(p.categoryId)?.name ?? '—' : '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                      p.isPack
                        ? 'bg-gold-400/20 text-gold-700'
                        : 'bg-cream-200 text-ink-700'
                    }`}
                  >
                    {p.isPack ? 'Pack' : 'Single'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right tabular">
                  {formatPrice(p.priceInPence)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      p.isActive ? 'bg-green-500' : 'bg-ink-300'
                    }`}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="p-2 hover:bg-ink-900/5 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deleting === p.id}
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

      
      <p className="text-xs text-ink-500">
        Showing {filtered.length} of {products.length} products.
      </p>
    </div>
  );
}
