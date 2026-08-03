import Image from 'next/image';
import type { SeasonalTheme } from '@/lib/settings';

const EFFECT = {
  christmas: { src: '/seasonal/snowflake.png', size: 22, count: 16 },
  easter: { src: '/seasonal/easter-egg.png', size: 20, count: 12 },
} as const;

/** A gentle, purely-decorative full-viewport overlay that plays once per page
 *  load (not a looping "rain") — falling snowflakes for Christmas mode,
 *  drifting eggs for Easter mode. Pure CSS animation (see .seasonal-fall-item
 *  in globals.css, `animation-iteration-count: 1`), no client JS needed. */
export function SeasonalEffects({ theme }: { theme: SeasonalTheme }) {
  if (theme === 'none') return null;
  const effect = EFFECT[theme];

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: effect.count }, (_, i) => {
        const left = (i * 61.8) % 100;
        const duration = 9 + (i % 5) * 2;
        const delay = i * 0.5;
        const drift = ((i % 3) - 1) * 40;
        return (
          <Image
            key={i}
            src={effect.src}
            alt=""
            width={effect.size}
            height={effect.size}
            className="seasonal-fall-item"
            style={
              {
                left: `${left}%`,
                width: effect.size,
                height: 'auto',
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                '--seasonal-drift': `${drift}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
