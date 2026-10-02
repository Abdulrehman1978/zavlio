import { NextResponse } from 'next/server';
import { crmPersonPatchSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireMinimumRole('OPERATOR');
    const body = crmPersonPatchSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const before = await db
      .from('people')
      .select('display_name,job_title,primary_phone,organization_id')
      .eq('id', id)
      .maybeSingle();
    if (before.error || !before.data)
      return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
    const update = await db
      .from('people')
      .update({
        ...(body.displayName !== undefined ? { display_name: body.displayName } : {}),
        ...(body.jobTitle !== undefined ? { job_title: body.jobTitle || null } : {}),
        ...(body.primaryPhone !== undefined ? { primary_phone: body.primaryPhone || null } : {}),
        ...(body.organizationId !== undefined ? { organization_id: body.organizationId } : {}),
      })
      .eq('id', id)
      .select('id')
      .single();
    if (update.error) throw update.error;
    await db.rpc('record_crm_audit', {
      p_action: 'PERSON_UPDATED',
      p_entity_type: 'person',
      p_entity_id: id,
      p_before_state: before.data,
      p_after_state: body,
    });
    void staff;
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to update this person.' }, { status: 400 });
  }
}
