'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative bg-ink-900 text-cream-50 overflow-hidden ink-paper">
      {/* Decorative gold borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-32 relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <div className="lg:col-span-7 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-gold-400/30"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              <span className="eyebrow text-gold-400">Erskine · Since 2015</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight"
            >
              Proper meat,
              <br />
              <span className="text-gold-400 italic">cut by hand.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-cream-200/90 text-lg leading-relaxed"
            >
              An independent butcher and fishmonger serving Erskine and the surrounding villages.
              Hand-cut Scottish beef, free-range chicken, fresh fish daily, and our famous
              meat packs — all at honest prices.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/meat-packs">
                <Button variant="gold" size="lg" className="group">
                  Shop meat packs
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-cream-50 border border-cream-50/30 hover:bg-cream-50 hover:text-ink-900"
                >
                  Browse the counter
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-12 flex items-center gap-6 pt-8 border-t border-cream-50/10"
            >
              <div className="stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-cream-200/80">
                <span className="text-cream-50 font-semibold">5.0</span> from local Google reviews —
                <Link href="/reviews" className="text-gold-400 hover:underline ml-1">
                  read them all
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Logo plate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Decorative concentric rings */}
              <div className="absolute inset-0 border border-gold-400/15 rotate-3" />
              <div className="absolute inset-3 border border-gold-400/25 -rotate-2" />

              {/* The logo */}
              <div className="absolute inset-6 bg-ink-900 flex items-center justify-center p-8 menu-plate">
                <Image
                  src="/logo.png"
                  alt="Gary's Butchers & Fishmongers"
                  width={400}
                  height={400}
                  className="w-full h-auto relative z-10"
                  priority
                />
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ rotate: [0, -2, 0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 h-24 w-24 lg:h-32 lg:w-32 rounded-full bg-gold-400 text-ink-900 flex flex-col items-center justify-center text-center shadow-xl"
              >
                <span className="font-display text-2xl lg:text-3xl leading-none">£25+</span>
                <span className="eyebrow text-[9px] mt-1">Free<br />delivery</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
