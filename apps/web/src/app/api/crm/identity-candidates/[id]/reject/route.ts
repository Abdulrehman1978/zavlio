import { NextResponse } from 'next/server';
import { identityCandidateRejectSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireMinimumRole('ADMIN');
    const body = identityCandidateRejectSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const result = await db
      .from('identity_match_candidates')
      .update({
        status: 'REJECTED',
        reviewed_by: staff.staff.id,
        reviewed_at: new Date().toISOString(),
        match_reasons: { review_reason: body.reason },
      })
      .eq('id', id)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data)
      return NextResponse.json(
        { error: 'Candidate is missing or already reviewed.' },
        { status: 409 },
      );
    await db.rpc('record_crm_audit', {
      p_action: 'IDENTITY_CANDIDATE_REJECTED',
      p_entity_type: 'identity_match_candidate',
      p_entity_id: id,
      p_after_state: { reason: body.reason },
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json(
      { error: 'Unable to reject this identity candidate.' },
      { status: 400 },
    );
  }
}
