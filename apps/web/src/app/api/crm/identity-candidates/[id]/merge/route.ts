import { NextResponse } from 'next/server';
import { personMergeSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('ADMIN');
    const body = personMergeSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();

    const candidateQuery = await db
      .from('identity_match_candidates')
      .select('id, person_a, person_b')
      .eq('id', id)
      .maybeSingle();

    let sourcePersonId = id;
    let candidateId: string | undefined = body.candidateId ?? undefined;

    if (candidateQuery.data) {
      candidateId = candidateQuery.data.id;
      sourcePersonId =
        candidateQuery.data.person_a === body.targetPersonId
          ? candidateQuery.data.person_b
          : candidateQuery.data.person_a;
    }

    const result = await db.rpc('merge_people', {
      p_source_person_id: sourcePersonId,
      p_target_person_id: body.targetPersonId,
      p_candidate_id: candidateId,
      p_reason: body.reason,
    });
    if (result.error) throw result.error;
    const outcome = result.data?.[0];
    if (!outcome)
      return NextResponse.json({ error: 'Merge did not produce an outcome.' }, { status: 409 });
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to merge these people.' }, { status: 400 });
  }
}
