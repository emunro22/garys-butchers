'use client';

import Image from 'next/image';
import { useSeasonalTheme } from './seasonal-theme-context';

const DECORATIONS = {
  christmas: {
    src: '/seasonal/santa-hat.png',
    width: 56,
    height: 59,
    className: 'rotate-[22deg]',
  },
  easter: {
    src: '/seasonal/easter-egg.png',
    width: 40,
    height: 33,
    className: 'rotate-[18deg]',
  },
} as const;

/** Drop as a sibling of (not inside) a product/category tile's image box —
 *  i.e. into a `relative` wrapper that does NOT have `overflow-hidden`, such
 *  as the tile's outer card/link. Renders a small decoration straddling the
 *  top-right corner — half on the photo, half off it — tilted jauntily, when
 *  a seasonal theme is active, or nothing otherwise. It deliberately sits
 *  outside the image's own `overflow-hidden` box (rather than being clipped
 *  to a positive inset within it) so it actually reads as sitting on the
 *  corner rather than being a badge on the photo. Reads the theme from
 *  context so it works from both client tiles (ProductCard) and
 *  server-rendered tiles (shop/page.tsx's grid). */
export function SeasonalCardDecoration() {
  const theme = useSeasonalTheme();
  if (theme === 'none') return null;
  const d = DECORATIONS[theme];

  return (
    <Image
      src={d.src}
      alt=""
      aria-hidden
      width={d.width}
      height={d.height}
      className={`pointer-events-none select-none absolute -top-3 -right-3 z-20 drop-shadow-md w-12 h-auto ${d.className}`}
    />
  );
}
