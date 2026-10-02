import { NextResponse } from 'next/server';
import { crmDncSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireMinimumRole('OPERATOR');
    const body = crmDncSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const before = await db.from('people').select('do_not_contact').eq('id', id).maybeSingle();
    if (before.error || !before.data)
      return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
    const desired = new URL(request.url).searchParams.get('value') !== 'false';
    if (!desired && !['ADMIN', 'OWNER'].includes(staff.staff.role))
      return NextResponse.json(
        { error: 'Only ADMIN or OWNER may clear do-not-contact.' },
        { status: 403 },
      );
    const update = await db
      .from('people')
      .update({ do_not_contact: desired })
      .eq('id', id)
      .select('id,do_not_contact')
      .single();
    if (update.error) throw update.error;
    await db.rpc('record_crm_audit', {
      p_action: desired ? 'DNC_ENABLED' : 'DNC_CLEARED',
      p_entity_type: 'person',
      p_entity_id: id,
      p_before_state: before.data,
      p_after_state: { do_not_contact: desired, reason: body.reason },
    });
    return NextResponse.json({ ok: true, doNotContact: update.data.do_not_contact });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to update do-not-contact state.' }, { status: 400 });
  }
}
