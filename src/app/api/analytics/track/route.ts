import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { catalogDb } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';

const EventSchema = z.object({
  type: z.literal('pageview'),
  path: z.string().min(1).max(300),
  sessionId: z.string().min(1).max(40),
});

// Accepts either one event or a batch — the client queues events and flushes
// them together so a busy visitor doesn't open a DB write per navigation.
const TrackSchema = z.union([EventSchema, z.array(EventSchema).min(1).max(50)]);

export async function POST(req: NextRequest) {
  try {
    const body = TrackSchema.parse(await req.json());
    const events = Array.isArray(body) ? body : [body];
    await catalogDb.insert(analyticsEvents).values(
      events.map((e) => ({
        type: e.type,
        path: e.path,
        sessionId: e.sessionId,
      }))
    );
    return NextResponse.json({ ok: true });
  } catch {
    // Tracking must never surface an error to the visitor.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
