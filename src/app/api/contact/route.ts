import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactMessage, sendContactConfirmation } from '@/lib/email';

const ContactSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the form fields' },
        { status: 400 }
      );
    }
    await sendContactMessage(parsed.data);
    // Best-effort — the enquiry itself is already safely sent to the shop above.
    sendContactConfirmation(parsed.data).catch((err) => console.error('contact confirmation error', err));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact error', err);
    return NextResponse.json(
      { error: 'Could not send message right now' },
      { status: 500 }
    );
  }
}
