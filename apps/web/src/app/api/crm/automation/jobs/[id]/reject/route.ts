import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMinimumRole } from '../../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../../lib/supabase/server';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole('ADMIN');
    const { id } = await params;
    const b = z
      .object({
        expectedVersion: z.number().int().positive(),
        reason: z.string().trim().min(3).max(1000),
      })
      .parse(await request.json());
    const db = await createServerSupabaseClient();
    const { data, error } = await db.rpc('reject_automation_job', {
      p_job_id: id,
      p_expected_version: b.expectedVersion,
      p_reason: b.reason,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, job: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rejection failed.' },
      { status: 409 },
    );
  }
}
