import { NextResponse } from 'next/server';
import { taskCreateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';
import { toRpcNullable } from '../../../../lib/supabase/rpc';

export async function POST(request: Request) {
  try {
    await requireMinimumRole('OPERATOR');
    const body = taskCreateSchema.parse(await request.json());
    const db = await createServerSupabaseClient();
    const result = await db.rpc('create_crm_task', {
      p_person_id: toRpcNullable(body.personId),
      p_opportunity_id: toRpcNullable(body.opportunityId),
      p_assigned_to: toRpcNullable(body.assignedTo),
      p_title: body.title,
      p_description: toRpcNullable(body.description),
      p_due_at: toRpcNullable(body.dueAt),
      p_priority: body.priority,
    });
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, task: result.data[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to create task.' }, { status: 400 });
  }
}
