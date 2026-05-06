'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, MapPin } from 'lucide-react';
import { useCart, cartItemCount } from '@/lib/cart';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Beef', href: '/shop/beef' },
  { label: 'Pork', href: '/shop/pork' },
  { label: 'Chicken', href: '/shop/chicken' },
  { label: 'Fish', href: '/shop/fish' },
  { label: 'Meat packs', href: '/meat-packs' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = cartItemCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-cream-50/95 backdrop-blur-md border-b border-ink-900/10'
          : 'bg-cream-50 border-b border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-ink-900"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Left nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-8 flex-1">
            {nav.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="eyebrow text-ink-700 hover:text-ink-900 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link href="/" className="flex items-center justify-center" aria-label="Home">
            <Image
              src="/logo.png"
              alt="Gary's Butchers & Fishmongers"
              width={140}
              height={140}
              className="h-14 lg:h-16 w-auto bg-ink-900 p-1.5"
              priority
            />
          </Link>

          {/* Right nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-end">
            {nav.slice(3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="eyebrow text-ink-700 hover:text-ink-900 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-1 lg:gap-2 ml-4">
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center gap-1.5 eyebrow text-ink-700 hover:text-ink-900 px-3"
            >
              <MapPin className="h-3.5 w-3.5" />
              Erskine
            </Link>
            <button
              onClick={openCart}
              className="relative p-2 text-ink-900 hover:bg-ink-900/5 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold-400 text-ink-900 text-[10px] font-bold flex items-center justify-center"
                >
                  {count}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-ink-900/50 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-cream-50 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-ink-900/10">
                <Image src="/logo.png" alt="" width={48} height={48} className="bg-ink-900 p-1" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-ink-900"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col p-5 gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-2xl py-3 border-b border-ink-900/10 text-ink-900"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-2xl py-3 border-b border-ink-900/10 text-ink-900"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-2xl py-3 text-ink-900"
                >
                  Contact
                </Link>
              </nav>
              <div className="mt-auto p-5 bg-ink-900 text-cream-50">
                <p className="eyebrow text-gold-400 mb-2">Visit the shop</p>
                <p className="text-sm leading-relaxed">
                  Bridgewater Shopping Centre,
                  <br />
                  Erskine, PA8 7AA
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
