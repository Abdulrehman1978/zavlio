import { NextResponse } from 'next/server';
import { crmNoteSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireMinimumRole('OPERATOR');
    const body = crmNoteSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const result = await db
      .from('notes')
      .insert({ person_id: id, author_id: staff.staff.id, body: body.body, visibility: 'INTERNAL' })
      .select('id,body,created_at,visibility')
      .single();
    if (result.error) throw result.error;
    await db.rpc('record_crm_audit', {
      p_action: 'NOTE_CREATED',
      p_entity_type: 'note',
      p_entity_id: result.data.id,
      p_after_state: { person_id: id, visibility: 'INTERNAL' },
    });
    return NextResponse.json({ ok: true, note: result.data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to add note.' }, { status: 400 });
  }
}
