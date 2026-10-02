import { NextResponse } from 'next/server';
import { crmOrganizationPatchSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('OPERATOR');
    const body = crmOrganizationPatchSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const before = await db
      .from('organizations')
      .select('name,website,industry,size_range,country,notes')
      .eq('id', id)
      .maybeSingle();
    if (before.error || !before.data)
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    const result = await db
      .from('organizations')
      .update({
        name: body.name,
        website: body.website || null,
        industry: body.industry || null,
        size_range: body.sizeRange || null,
        country: body.country || null,
        notes: body.notes || null,
      })
      .eq('id', id)
      .select('id')
      .single();
    if (result.error) throw result.error;
    await db.rpc('record_crm_audit', {
      p_action: 'ORGANIZATION_UPDATED',
      p_entity_type: 'organization',
      p_entity_id: id,
      p_before_state: before.data,
      p_after_state: body,
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to update this organization.' }, { status: 400 });
  }
}
