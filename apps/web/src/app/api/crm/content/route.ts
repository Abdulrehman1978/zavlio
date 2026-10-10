import { NextResponse } from 'next/server';
import { contentItemCreateSchema, contentItemUpdateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const json = await request.json();

    const isUpdate = Boolean(json.id);
    const body = isUpdate
      ? contentItemUpdateSchema.parse(json)
      : contentItemCreateSchema.parse(json);

    // If publishing or archiving, enforce ADMIN or OWNER role
    if (body.status === 'PUBLISHED' || body.status === 'ARCHIVED') {
      await requireMinimumRole('ADMIN');
    }

    const db = await createServerSupabaseClient();
    const table = body.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableQuery = (db as any).from(table);

    if (isUpdate && 'id' in body && typeof body.id === 'string') {
      const updateId = body.id;

      // Check for slug collision on other records
      const { data: existing } = await tableQuery
        .select('id')
        .eq('slug', body.slug)
        .neq('id', updateId)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: `Slug '${body.slug}' is already in use by another ${table} item.` },
          { status: 400 },
        );
      }

      // Fetch before_state for audit
      const { data: prevData } = await tableQuery.select('*').eq('id', updateId).single();

      const updatePayload: Record<string, unknown> = {
        title: body.title,
        slug: body.slug,
        status: body.status,
        visibility: body.visibility,
        claim_status: body.claimStatus || null,
        demo_content: body.demoContent,
        seo_title: body.seoTitle || null,
        seo_description: body.seoDescription || null,
        updated_by: staff.id,
        updated_at: new Date().toISOString(),
      };

      if (body.status === 'PUBLISHED' && (!prevData || !prevData.published_at)) {
        updatePayload.published_at = new Date().toISOString();
      }

      if (table === 'projects') {
        updatePayload.project_type = body.summary || null;
      } else {
        updatePayload.summary = body.summary || null;
      }

      const { data: updated, error: updateError } = await tableQuery
        .update(updatePayload)
        .eq('id', updateId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Append-only audit log
      await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action: body.status === 'PUBLISHED' ? 'CONTENT_PUBLISHED' : 'CONTENT_UPDATED',
        entity_type: table,
        entity_id: updateId,
        before_state: prevData ? (prevData as never) : null,
        after_state: updated ? (updated as never) : null,
      });

      return NextResponse.json({ ok: true, item: updated }, { status: 200 });
    } else {
      // Check for slug collision
      const { data: existing } = await tableQuery.select('id').eq('slug', body.slug).limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: `Slug '${body.slug}' is already in use.` },
          { status: 400 },
        );
      }

      const insertPayload: Record<string, unknown> = {
        title: body.title,
        slug: body.slug,
        status: body.status,
        visibility: body.visibility,
        claim_status: body.claimStatus || null,
        demo_content: body.demoContent,
        seo_title: body.seoTitle || null,
        seo_description: body.seoDescription || null,
        created_by: staff.id,
        updated_by: staff.id,
      };

      if (body.status === 'PUBLISHED') {
        insertPayload.published_at = new Date().toISOString();
      }

      if (table === 'projects') {
        updatePayloadIfProject(insertPayload, body.summary);
      } else {
        insertPayload.summary = body.summary || null;
      }

      const { data: inserted, error: insertError } = await tableQuery
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      // Append-only audit log
      await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action: 'CONTENT_CREATED',
        entity_type: table,
        entity_id: (inserted as { id: string }).id,
        after_state: inserted ? (inserted as never) : null,
      });

      return NextResponse.json({ ok: true, item: inserted }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: Number(error.status) });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save content.' },
      { status: 400 },
    );
  }
}

function updatePayloadIfProject(payload: Record<string, unknown>, summary?: string | null) {
  payload.project_type = summary || null;
  payload.disciplines = [];
}
