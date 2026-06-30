'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'bestseller', label: 'Best sellers' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
  { value: 'name', label: 'Name: A to Z' },
] as const;

export function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'bestseller';

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'bestseller') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-700">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="border border-ink-900/15 bg-cream-50 px-3 py-2 text-xs uppercase tracking-[0.18em] text-ink-900 hover:border-ink-900 transition-colors focus:outline-none focus:border-ink-900 cursor-pointer"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
