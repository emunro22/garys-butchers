import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { catalogDb } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';

const TrackSchema = z.object({
  type: z.enum(['pageview', 'click']),
  path: z.string().min(1).max(300),
  label: z.string().max(200).optional(),
  sessionId: z.string().min(1).max(40),
});

export async function POST(req: NextRequest) {
  try {
    const body = TrackSchema.parse(await req.json());
    await catalogDb.insert(analyticsEvents).values({
      type: body.type,
      path: body.path,
      label: body.label,
      sessionId: body.sessionId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Tracking must never surface an error to the visitor.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
