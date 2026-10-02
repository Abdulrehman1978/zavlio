import { NextResponse } from 'next/server';
import { opportunityTransitionSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';
import { toRpcNullable } from '../../../../../../lib/supabase/rpc';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('OPERATOR');
    const body = opportunityTransitionSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const result = await db.rpc('transition_opportunity_stage', {
      p_opportunity_id: id,
      p_target_stage_id: body.targetStageId,
      p_expected_updated_at: body.expectedUpdatedAt,
      p_reason: toRpcNullable(body.reason ?? null),
      p_lost_reason: toRpcNullable(body.lostReason ?? null),
    });
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, opportunity: result.data[0] });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to move opportunity.' }, { status: 409 });
  }
}
