import { NextResponse } from 'next/server';
import { recalculateLeadScore } from '@zavlio/crm/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('OPERATOR');
    const { id } = await context.params;
    const result = await recalculateLeadScore(
      await createServerSupabaseClient(),
      createAdminDatabaseClient(),
      id,
      { persist: true, forceSnapshot: true },
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof Error && 'status' in error)
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    return NextResponse.json({ error: 'Unable to recalculate score.' }, { status: 400 });
  }
}
