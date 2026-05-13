'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

export function NewsletterSignup({
  variant = 'light',
  source = 'website',
}: {
  variant?: 'light' | 'dark';
  source?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Could not sign you up');
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not sign you up');
    }
  }

  const dark = variant === 'dark';

  if (status === 'done') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 border ${
          dark
            ? 'border-gold-400/40 bg-gold-400/10 text-cream-50'
            : 'border-gold-500/40 bg-gold-50 text-ink-900'
        }`}
      >
        <Check className={`h-5 w-5 ${dark ? 'text-gold-400' : 'text-gold-600'}`} />
        <p className="text-sm">
          Thanks — you&apos;re on the list. Look out for offers and seasonal specials.
        </p>
      </div>
    );
  }

return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2"
      suppressHydrationWarning>      
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
        className={`flex-1 ${
          dark
            ? 'bg-ink-800 border-gold-400/20 text-cream-50 placeholder:text-cream-200/40'
            : ''
        }`}
        aria-label="Email address"
      />
      <Button
        type="submit"
        variant={dark ? 'gold' : 'primary'}
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Joining…' : 'Subscribe'}
      </Button>
      {status === 'error' && error && (
        <p className="text-xs sm:basis-full text-butcher-500">{error}</p>
      )}
    </form>
  );
}