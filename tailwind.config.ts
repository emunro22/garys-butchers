import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — gold on charcoal, with butcher's red and cream
        ink: {
          DEFAULT: '#0a0a0a',
          50: '#f6f5f3',
          100: '#e8e6e2',
          200: '#c9c5bd',
          300: '#9c958a',
          400: '#6e6759',
          500: '#4a443a',
          600: '#2c2823',
          700: '#1a1815',
          800: '#0f0e0c',
          900: '#0a0a0a',
        },
        // gold/butcher are driven by CSS custom properties (see globals.css) so an
        // admin-toggled seasonal theme (Christmas/Easter) can recolour the whole
        // site at runtime via a `data-theme` attribute, without a second build.
        gold: {
          DEFAULT: 'var(--color-gold-400)',
          50: 'var(--color-gold-50)',
          100: 'var(--color-gold-100)',
          200: 'var(--color-gold-200)',
          300: 'var(--color-gold-300)',
          400: 'var(--color-gold-400)',
          500: 'var(--color-gold-500)',
          600: 'var(--color-gold-600)',
          700: 'var(--color-gold-700)',
          800: 'var(--color-gold-800)',
          900: 'var(--color-gold-900)',
        },
        butcher: {
          DEFAULT: 'var(--color-butcher-500)',
          50: 'var(--color-butcher-50)',
          100: 'var(--color-butcher-100)',
          400: 'var(--color-butcher-400)',
          500: 'var(--color-butcher-500)',
          600: 'var(--color-butcher-600)',
          700: 'var(--color-butcher-700)',
        },
        cream: {
          DEFAULT: '#f8f5f0',
          50: '#fdfbf7',
          100: '#f8f5f0',
          200: '#ede6d9',
          300: '#dccdb6',
          400: '#c4ad89',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        widest: '0.25em',
      },
      backgroundImage: {
        'noise':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
        'gold-shimmer':
          'linear-gradient(110deg, transparent 25%, rgba(201,169,97,0.18) 50%, transparent 75%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      boxShadow: {
        'plate':
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(201,169,97,0.12), 0 30px 60px -30px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
