import { NextResponse } from 'next/server';
import { campaignCreateSchema, campaignUpdateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const json = await request.json();

    const isUpdate = Boolean(json.id);
    const body = isUpdate ? campaignUpdateSchema.parse(json) : campaignCreateSchema.parse(json);

    // If activating or archiving, require ADMIN or OWNER role
    if (body.status === 'ACTIVE' || body.status === 'ARCHIVED') {
      await requireMinimumRole('ADMIN');
    }

    const db = await createServerSupabaseClient();

    if (isUpdate && 'id' in body && typeof body.id === 'string') {
      const campaignId = body.id;
      const { data: prevData } = await db
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      const { data: updated, error: updateError } = await db
        .from('campaigns')
        .update({
          name: body.name,
          type: body.type,
          status: body.status,
          starts_at: body.startsAt || null,
          ends_at: body.endsAt || null,
          audience_definition: body.audienceDefinition as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Append-only audit
      await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action: 'CAMPAIGN_UPDATED',
        entity_type: 'campaigns',
        entity_id: campaignId,
        before_state: prevData ? (prevData as never) : null,
        after_state: updated ? (updated as never) : null,
      });

      return NextResponse.json({ ok: true, campaign: updated }, { status: 200 });
    } else {
      const { data: inserted, error: insertError } = await db
        .from('campaigns')
        .insert({
          name: body.name,
          type: body.type,
          status: body.status,
          starts_at: body.startsAt || null,
          ends_at: body.endsAt || null,
          audience_definition: body.audienceDefinition as never,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Append-only audit
      await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action: 'CAMPAIGN_CREATED',
        entity_type: 'campaigns',
        entity_id: (inserted as { id: string }).id,
        after_state: inserted ? (inserted as never) : null,
      });

      return NextResponse.json({ ok: true, campaign: inserted }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save campaign.' },
      { status: 400 },
    );
  }
}
