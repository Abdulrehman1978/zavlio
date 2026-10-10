import { NextResponse } from 'next/server';
import { privacyRequestCreateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { generateSubjectExport } from '../../../../../lib/crm/consent-data';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const json = await request.json();
    const body = privacyRequestCreateSchema.parse(json);

    if (body.requestType !== 'EXPORT') {
      return NextResponse.json(
        { error: 'Invalid request type for export endpoint' },
        { status: 400 },
      );
    }

    const db = await createServerSupabaseClient();
    const exportData = await generateSubjectExport(db, body.personId);

    // Audit log
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: staff.id,
      action: 'PRIVACY_DATA_EXPORTED',
      entity_type: 'people',
      entity_id: body.personId,
      after_state: {
        verifiedIdentity: body.verifiedIdentity,
        notes: body.notes || null,
        exportedAt: exportData.exportMetadata.generatedAt,
      } as never,
    });

    return NextResponse.json({ ok: true, export: exportData }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to generate subject export.' },
      { status: 400 },
    );
  }
}
