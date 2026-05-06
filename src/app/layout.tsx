import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: "Gary's Butchers & Fishmongers — Erskine",
    template: "%s · Gary's Butchers & Fishmongers",
  },
  description:
    'Independent butcher and fishmonger in Erskine. Hand-cut Scottish beef, free-range chicken, fresh fish daily, and our famous meat packs. Pickup or free home delivery on orders over £25.',
  keywords: [
    'butcher Erskine',
    'butcher near me',
    'meat packs Scotland',
    'fishmonger Erskine',
    'Scottish beef',
    'free range chicken',
    "Gary's Butchers",
  ],
  openGraph: {
    type: 'website',
    title: "Gary's Butchers & Fishmongers",
    description:
      'Independent butcher and fishmonger in Erskine since 2015. Hand-cut Scottish meat, fresh fish daily, and our famous meat packs.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
