'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-ink-900/10 border-y border-ink-900/10">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full py-6 flex items-center justify-between gap-6 text-left group"
            >
              <span className="font-display text-lg md:text-xl text-ink-900 group-hover:text-gold-700 transition-colors">
                {item.q}
              </span>
              <span className="shrink-0 h-9 w-9 rounded-full border border-ink-900/15 flex items-center justify-center group-hover:border-gold-500 transition-colors">
                {isOpen ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pr-12 text-ink-700 leading-relaxed">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
