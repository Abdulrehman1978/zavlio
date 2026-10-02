import { NextResponse } from 'next/server';
import { taskUpdateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';
import { toRpcNullable } from '../../../../../lib/supabase/rpc';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('OPERATOR');
    const body = taskUpdateSchema.parse(await request.json());
    const { id } = await context.params;
    const db = await createServerSupabaseClient();
    const result = await db.rpc('update_crm_task', {
      p_id: id,
      p_expected_updated_at: body.expectedUpdatedAt,
      p_assigned_to: toRpcNullable(body.assignedTo),
      p_title: body.title,
      p_description: toRpcNullable(body.description),
      p_due_at: toRpcNullable(body.dueAt),
      p_priority: body.priority,
      p_status: body.status,
    });
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, task: result.data[0] });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to update task.' }, { status: 409 });
  }
}
