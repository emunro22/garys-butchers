import { cn } from '@/lib/utils';

type Tone = 'gold' | 'ink' | 'butcher' | 'cream';

const tones: Record<Tone, string> = {
  gold: 'bg-gold-400 text-ink-900',
  ink: 'bg-ink-900 text-cream-50',
  butcher: 'bg-butcher-500 text-cream-50',
  cream: 'bg-cream-200 text-ink-900',
};

export function Badge({
  children,
  tone = 'gold',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
