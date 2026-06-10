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
        'sticky top-0 z-40 transition-all duration-300 bg-cream-50 border-b border-ink-900/10',
        scrolled && 'shadow-sm'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-3 items-center h-16 lg:h-20">

          {/* Left column: hamburger (mobile) | left nav (desktop) */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 -ml-2 text-ink-900 hover:bg-ink-900/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden lg:flex items-center gap-8">
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
          </div>

          {/* Centre column: logo — always perfectly centred */}
          <div className="flex items-center justify-center">
            <Link href="/" aria-label="Home">
              <div className="h-12 lg:h-14 aspect-square rounded-full bg-ink-900 p-1.5 overflow-hidden flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Gary's Butchers & Fishmongers"
                  width={140}
                  height={140}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right column: right nav (desktop) + icons */}
          <div className="flex items-center justify-end gap-1 lg:gap-2">
            <nav className="hidden lg:flex items-center gap-8 mr-2">
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
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center gap-1.5 eyebrow text-ink-700 hover:text-ink-900 px-3"
            >
              <MapPin className="h-3.5 w-3.5" />
              Erskine
            </Link>
            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10 text-ink-900 hover:bg-ink-900/5 transition-colors"
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
              className="fixed inset-y-0 left-0 w-[300px] max-w-[90vw] bg-ink-900 z-50 lg:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-50/10">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-cream-50 p-1 overflow-hidden">
                    <Image src="/logo.png" alt="" width={40} height={40} className="w-full h-full object-contain" />
                  </div>
                  <span className="eyebrow text-gold-400 text-[10px]">Gary&apos;s Butchers</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-9 h-9 text-cream-50/70 hover:text-cream-50 hover:bg-cream-50/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-2">
                {[...nav, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-5 py-4 font-display text-xl text-cream-50 hover:bg-cream-50/10 border-b border-cream-50/8 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Footer strip */}
              <div className="px-5 py-5 border-t border-cream-50/10">
                <p className="eyebrow text-gold-400 mb-1">Visit us in store</p>
                <p className="text-sm text-cream-50/70 leading-relaxed">
                  Bridgewater Shopping Centre,<br />Erskine, PA8 7AA
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
