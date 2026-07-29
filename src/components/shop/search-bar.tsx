'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { recordSearchInterest } from '@/lib/search-history';

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceInPence: number;
  weightLabel: string | null;
  isPack: boolean;
  categoryId: string | null;
};

/**
 * Two modes:
 * - variant="page": navigates to /search?q=... on submit (used in the header, from any page)
 * - variant="inline": updates the `q` param on the current page in place (used on listing pages to filter what's already shown)
 *
 * Both show a live "suggest" dropdown (image + name + price) as you type.
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        const results: Suggestion[] = data.products ?? [];
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlighted(-1);
        // Seeing a match for what you typed is a soft signal of interest —
        // selecting a suggestion (below) counts for more.
        if (results[0]) recordSearchInterest(results[0].categoryId, 1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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
    setOpen(false);
    onNavigate?.();
  }

  function selectSuggestion(s: Suggestion) {
    recordSearchInterest(s.categoryId, 3);
    setOpen(false);
    setValue('');
    onNavigate?.();
    router.push(s.isPack ? `/shop/meat-packs/${s.slug}` : `/product/${s.slug}`);
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (highlighted >= 0 && suggestions[highlighted]) {
            selectSuggestion(suggestions[highlighted]);
          } else {
            go(value);
          }
        }}
        className="relative flex items-center"
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlighted((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="Search products"
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          className="w-full bg-cream-50 border border-ink-900/15 pl-9 pr-9 h-11 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              setSuggestions([]);
              setOpen(false);
              if (variant === 'inline') go('');
            }}
            aria-label="Clear search"
            className="absolute right-3 text-ink-400 hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-cream-50 border border-ink-900/15 shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                  i === highlighted ? 'bg-ink-900/5' : 'hover:bg-ink-900/5'
                )}
              >
                <div className="relative h-10 w-10 shrink-0 bg-ink-900/5 overflow-hidden">
                  {s.imageUrl && <Image src={s.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-900 truncate">{s.name}</p>
                  {s.weightLabel && <p className="text-xs text-ink-500">{s.weightLabel}</p>}
                </div>
                <p className="text-sm tabular text-ink-700 shrink-0">{formatPrice(s.priceInPence)}</p>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(value)}
              className="w-full px-3 py-2.5 text-left text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 border-t border-ink-900/10"
            >
              See all results for “{value.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
