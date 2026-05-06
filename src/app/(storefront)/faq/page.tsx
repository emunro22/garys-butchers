'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'Do you deliver?',
    a: 'Yes — free home delivery on orders over £25 in the local Erskine area. Below £25, delivery is £3.50. Orders placed before 10am are delivered same day where possible.',
  },
  {
    q: 'Can I click & collect?',
    a: 'Absolutely. Place your order online, choose a pickup slot at checkout, and collect from our shop in Bridgewater Shopping Centre, Erskine. No charge for click & collect.',
  },
  {
    q: 'How fresh is the meat?',
    a: 'Everything in your order is hand-cut on the day of delivery or collection. Nothing is pre-packed or sat on a shelf for days.',
  },
  {
    q: 'Where does your meat come from?',
    a: 'Scottish-sourced wherever possible. We work with local farms and suppliers we know personally. The same goes for the fish on our fishmonger counter — fresh from the Scottish coast.',
  },
  {
    q: 'Can I order something specific that isn\'t on the website?',
    a: 'Yes — just give us a call or use the contact form with your request. We can prepare special cuts, larger joints for events, or custom mixes from our meat packs.',
  },
  {
    q: 'How do meat packs work?',
    a: 'Each pack contains a curated selection of cuts that gives great value over buying separately. The full contents are listed on each pack page. Your pack is bagged the day you collect or have it delivered.',
  },
  {
    q: 'How do I use a discount code?',
    a: 'Add your items to the basket, then enter the code at checkout in the “Discount code” field. We run regular promotions — sign up to our newsletter or check our Facebook for the latest.',
  },
  {
    q: 'Do you do gift vouchers?',
    a: 'Yes, please pop into the shop or get in touch for gift vouchers. They make great presents for Christmas, birthdays and Father\'s Day.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major debit and credit cards via secure Stripe checkout (Visa, Mastercard, Amex, Apple Pay, Google Pay).',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Get in touch as soon as possible — we\'ll do everything we can to amend or cancel before your meat is cut. Once it\'s prepared, we may not be able to refund.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Help</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Frequently asked
          </h1>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
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
        </div>
      </section>
    </div>
  );
}
