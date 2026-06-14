'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Truck, Clock } from 'lucide-react';

const blocks = [
  {
    icon: ShoppingBag,
    title: 'Click & collect',
    body: 'Order online and collect from the shop on Bridgewater. Usually ready within 24 hours, and there&apos;s no surcharge.',
  },
  {
    icon: Truck,
    title: 'Free home delivery',
    body: 'Free delivery on orders over £25 within 10 miles. £3.50 for smaller orders nearby, £5 further afield.',
  },
  {
    icon: Clock,
    title: 'Cut fresh, daily',
    body: 'Everything is prepared the morning of your delivery or collection. Fish lands Tuesday to Saturday.',
  },
];

export function DeliveryStrip() {
  return (
    <section className="py-16 lg:py-20 bg-gold-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
          {blocks.map((block, i) => {
            const Icon = block.icon;
            return (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-5"
              >
                <div className="h-12 w-12 shrink-0 border border-ink-900/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-ink-900" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-xl mb-2 text-ink-900">{block.title}</h3>
                  <p className="text-sm text-ink-800 leading-relaxed">{block.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
