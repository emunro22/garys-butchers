import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-cream-50 hover:bg-ink-800 active:bg-ink-700 border border-ink-900',
  gold: 'bg-gold-400 text-ink-900 hover:bg-gold-300 active:bg-gold-500 border border-gold-500',
  outline:
    'bg-transparent text-ink-900 border border-ink-900/30 hover:border-ink-900 hover:bg-ink-900/5',
  ghost: 'bg-transparent text-ink-900 hover:bg-ink-900/5',
  danger:
    'bg-butcher-500 text-cream-50 hover:bg-butcher-600 active:bg-butcher-700 border border-butcher-600',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-none font-medium uppercase tracking-[0.14em] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
