import { NextResponse } from 'next/server';
import { campaignMemberAddSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../../../lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const { id: campaignId } = await params;
    const json = await request.json();

    const body = campaignMemberAddSchema.parse({
      ...json,
      campaignId,
    });

    const db = await createServerSupabaseClient();

    // Check if canonical person exists
    const canonical = await db.rpc('resolve_canonical_person_id', {
      p_person_id: body.personId,
    });
    const effectivePersonId = canonical.data || body.personId;

    // Check if person is DNC (flag warning, but allow membership recording with explicit suppressed status)
    const { data: person } = await db
      .from('people')
      .select('id, do_not_contact')
      .eq('id', effectivePersonId)
      .single();

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const memberStatus = person.do_not_contact ? 'EXCLUDED' : body.status;

    const { data: inserted, error: insertError } = await db
      .from('campaign_members')
      .upsert(
        {
          campaign_id: campaignId,
          person_id: effectivePersonId,
          status: memberStatus,
        },
        { onConflict: 'campaign_id,person_id' },
      )
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: staff.id,
      action: 'CAMPAIGN_MEMBER_ADDED',
      entity_type: 'campaign_members',
      entity_id: campaignId,
      after_state: inserted as never,
    });

    return NextResponse.json(
      {
        ok: true,
        member: inserted,
        suppressed: Boolean(person.do_not_contact),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to add campaign member.' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const { id: campaignId } = await params;
    const url = new URL(request.url);
    const personId = url.searchParams.get('personId');

    if (!personId) {
      return NextResponse.json({ error: 'personId query param is required' }, { status: 400 });
    }

    const db = await createServerSupabaseClient();

    const { error: deleteError } = await db
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('person_id', personId);

    if (deleteError) throw deleteError;

    // Audit log
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: staff.id,
      action: 'CAMPAIGN_MEMBER_REMOVED',
      entity_type: 'campaign_members',
      entity_id: campaignId,
      before_state: { campaign_id: campaignId, person_id: personId } as never,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to remove campaign member.' },
      { status: 400 },
    );
  }
}
