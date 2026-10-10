import { NextResponse } from 'next/server';
import { privacyRequestCreateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../lib/auth/guards';
import { generateAnonymizePreview } from '../../../../../lib/crm/consent-data';
import { createServerSupabaseClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const staffContext = await requireMinimumRole('ADMIN');
    const staff = staffContext.staff;
    const json = await request.json();
    const body = privacyRequestCreateSchema.parse(json);

    if (body.requestType !== 'ANONYMIZATION') {
      return NextResponse.json(
        { error: 'Invalid request type for anonymize preview endpoint' },
        { status: 400 },
      );
    }

    const db = await createServerSupabaseClient();
    const preview = await generateAnonymizePreview(db, body.personId);

    // Audit log of dry-run inspection
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: staff.id,
      action: 'PRIVACY_ANONYMIZE_PREVIEW',
      entity_type: 'people',
      entity_id: body.personId,
      after_state: {
        verifiedIdentity: body.verifiedIdentity,
        notes: body.notes || null,
        previewStats: preview.scopeToAnonymize,
      } as never,
    });

    return NextResponse.json({ ok: true, preview }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to generate anonymization preview.',
      },
      { status: 400 },
    );
  }
}
