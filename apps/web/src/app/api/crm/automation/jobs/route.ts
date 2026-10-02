import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';
import { toRpcNullable } from '../../../../../lib/supabase/rpc';
const schema = z.object({
  personId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable().optional(),
  channel: z.enum(['EMAIL', 'INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN', 'INTERNAL']),
  action: z.enum([
    'SEND_EMAIL',
    'DM',
    'REPLY',
    'COMMENT',
    'LIKE',
    'FOLLOW',
    'CONNECT',
    'PUBLISH',
    'CREATE_TASK',
    'FLAG_FOR_REVIEW',
    'NOOP',
  ]),
  purpose: z.enum([
    'MARKETING',
    'SALES_FOLLOW_UP',
    'INBOUND_REPLY',
    'TRANSACTIONAL',
    'RELATIONSHIP',
    'INTERNAL',
  ]),
  text: z.string().trim().min(1).max(4000),
  idempotencyKey: z.string().min(8).max(200),
  sourceReference: z.string().max(200).optional(),
});
export async function POST(request: Request) {
  try {
    await requireMinimumRole('OPERATOR');
    const b = schema.parse(await request.json());
    const db = await createServerSupabaseClient();
    const { data, error } = await db.rpc('propose_automation_job', {
      p_person_id: b.personId,
      p_opportunity_id: toRpcNullable<string>(b.opportunityId ?? null),
      p_channel: b.channel,
      p_action: b.action,
      p_purpose: b.purpose,
      p_payload: { schemaVersion: 1, text: b.text },
      p_idempotency_key: b.idempotencyKey,
      p_source_reference: toRpcNullable<string>(b.sourceReference ?? null),
      p_scheduled_for: new Date().toISOString(),
      p_priority: 0,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, job: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to propose automation job.' },
      { status: 400 },
    );
  }
}
