import { NextResponse } from 'next/server';
import { opportunityPatchSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';
import { toRpcNullable } from '../../../../../lib/supabase/rpc';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('OPERATOR');
    const body = opportunityPatchSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const result = await db.rpc('update_opportunity', {
      p_id: id,
      p_expected_updated_at: body.expectedUpdatedAt,
      p_title: body.title,
      p_estimated_value: toRpcNullable(
        body.estimatedValue === null ? null : Number(body.estimatedValue),
      ),
      p_currency: body.currency,
      p_probability: toRpcNullable(body.probability),
      p_service_interest: body.serviceInterests,
      p_owner_id: toRpcNullable(body.ownerId),
      p_expected_close_date: toRpcNullable(body.expectedCloseDate),
    });
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, opportunity: result.data[0] });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to update opportunity.' }, { status: 409 });
  }
}
