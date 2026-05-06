'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      message: String(fd.get('message') ?? ''),
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not send message');
      }
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not send message');
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-gold-400/40 bg-gold-50 p-6 text-center">
        <p className="font-display text-2xl text-ink-900">Thanks!</p>
        <p className="text-ink-700 mt-2">
          Your message has been sent. We&apos;ll be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required autoComplete="name" />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div>
        <Label htmlFor="contact-msg">Message</Label>
        <Textarea id="contact-msg" name="message" rows={5} required />
      </div>
      {error && <p className="text-sm text-butcher-500">{error}</p>}
      <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
