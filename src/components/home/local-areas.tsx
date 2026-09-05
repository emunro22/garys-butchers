'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const areas = [
  {
    name: 'Erskine',
    body: "The shop itself: Park Glade Shops. Pop in for a fresh-cut order, or book a click & collect slot online and it'll be ready to grab on your way past.",
  },
  {
    name: 'Renfrew',
    body: 'A regular delivery round for us: Sunday roast joints, meat packs and fresh fish, ordered online and dropped at the door.',
  },
  {
    name: 'Inchinnan',
    body: 'Well within our home delivery area. Order before the cutoff and choose a delivery slot that suits, or same-day if you need it sooner.',
  },
  {
    name: 'Bridge of Weir',
    body: 'A little further out, but still on our delivery route, with the same hand-cut meat and daily fish, delivered rather than collected.',
  },
];

export function LocalAreas() {
  return (
    <section className="py-16 md:py-24 bg-cream-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <p className="eyebrow text-ink-500 mb-3">Where we deliver</p>
        <h2 className="font-display text-3xl md:text-4xl text-ink-900 leading-tight max-w-2xl">
          Erskine, Renfrew, Inchinnan, Bridge of Weir, and everywhere in between.
        </h2>
        <p className="mt-4 text-ink-700 max-w-2xl leading-relaxed">
          We're based at Park Glade Shops in Erskine, with free home delivery within 5
          miles and paid delivery further out. See our{' '}
          <a href="/faq#delivery" className="underline decoration-gold-400 underline-offset-4 hover:text-ink-900">
            delivery &amp; pickup FAQ
          </a>{' '}
          for exact fees and cutoff times.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {areas.map((area, i) => (
            <motion.div
              key={area.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-cream-50 border border-ink-900/10 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gold-500" strokeWidth={1.5} />
                <h3 className="font-display text-lg text-ink-900">{area.name}</h3>
              </div>
              <p className="text-sm text-ink-700 leading-relaxed">{area.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
