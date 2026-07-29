'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Two modes:
 * - variant="page": navigates to /search?q=... on submit (used in the header, from any page)
 * - variant="inline": updates the `q` param on the current page in place (used on listing pages to filter what's already shown)
 */
export function SearchBar({
  variant = 'page',
  placeholder = 'Search products…',
  className,
  autoFocus,
  onNavigate,
}: {
  variant?: 'page' | 'inline';
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(variant === 'inline' ? searchParams.get('q') ?? '' : '');

  function go(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }
    const query = params.toString();
    const target = variant === 'page' ? '/search' : pathname;
    router.push(query ? `${target}?${query}` : target);
    onNavigate?.();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className={cn('relative flex items-center', className)}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autoFocus}
        className="w-full bg-cream-50 border border-ink-900/15 pl-9 pr-9 h-11 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            if (variant === 'inline') go('');
          }}
          aria-label="Clear search"
          className="absolute right-3 text-ink-400 hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
