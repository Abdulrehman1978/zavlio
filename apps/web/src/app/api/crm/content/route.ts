import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { contentItemCreateSchema, contentItemUpdateSchema } from '@zavlio/validation';
import { requireMinimumRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

function triggerRevalidation(table: string, slug: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    if (table === 'projects') {
      revalidatePath('/work');
      revalidatePath(`/work/${slug}`);
    } else if (table === 'services') {
      revalidatePath('/services');
      revalidatePath(`/services/${slug}`);
    } else if (table === 'lab_projects') {
      revalidatePath('/lab');
      revalidatePath(`/lab/${slug}`);
    } else if (table === 'insights') {
      revalidatePath('/insights');
      revalidatePath(`/insights/${slug}`);
    }
  } catch {
    // Graceful no-op in non-Next.js or unit test mock execution contexts
  }
}

export async function POST(request: Request) {
  try {
    const staffContext = await requireMinimumRole('OPERATOR');
    const staff = staffContext.staff;
    const json = await request.json();

    const isUpdate = Boolean(json.id);
    const body = isUpdate
      ? contentItemUpdateSchema.parse(json)
      : contentItemCreateSchema.parse(json);

    let db: SupabaseClient<Database>;
    try {
      db = createAdminDatabaseClient();
    } catch {
      db = await createServerSupabaseClient();
    }
    const table = body.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableQuery = (db as any).from(table);

    // Unapproved claim enforcement: Unapproved claims cannot be published
    if (
      body.status === 'PUBLISHED' &&
      (body.claimStatus === 'UNVERIFIED' || body.claimStatus === 'RETIRED')
    ) {
      return NextResponse.json(
        {
          error: `Cannot publish content with unapproved or retired claims (claim_status: ${body.claimStatus}).`,
        },
        { status: 400 },
      );
    }

    // Production demo content protection: Do not expose demo content in production
    const isProduction =
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
      !process.env.ALLOW_DEMO_PUBLISH;

    if (isProduction && body.demoContent && body.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot publish demo content in production environment.' },
        { status: 400 },
      );
    }

    if (isUpdate && 'id' in body && typeof body.id === 'string') {
      const updateId = body.id;

      // Fetch existing record to check prior state & roles
      const { data: prevData, error: fetchError } = await tableQuery
        .select('*')
        .eq('id', updateId)
        .single();

      if (fetchError || !prevData) {
        return NextResponse.json(
          { error: `Item with id ${updateId} not found in ${table}.` },
          { status: 404 },
        );
      }

      // If item is being published, archived, OR was already published/archived, require ADMIN role
      const isAffectingLiveContent =
        body.status === 'PUBLISHED' ||
        body.status === 'ARCHIVED' ||
        prevData.status === 'PUBLISHED' ||
        prevData.status === 'ARCHIVED';

      if (isAffectingLiveContent) {
        await requireMinimumRole('ADMIN');
      }

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

      if (body.status === 'PUBLISHED' && !prevData.published_at) {
        updatePayload.published_at = new Date().toISOString();
      }

      if (table === 'projects') {
        updatePayload.project_type = body.summary || null;
      } else if (table === 'insights') {
        updatePayload.body = {
          abstract: body.summary || '',
          heading: 'Core Architecture',
          paragraphs: [body.summary || ''],
        };
      } else {
        updatePayload.summary = body.summary || null;
      }

      const { data: updated, error: updateError } = await tableQuery
        .update(updatePayload)
        .eq('id', updateId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Append-only audit log with transactional rollback guard
      const { error: auditError } = await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action:
          body.status === 'PUBLISHED'
            ? 'CONTENT_PUBLISHED'
            : body.status === 'ARCHIVED'
              ? 'CONTENT_ARCHIVED'
              : 'CONTENT_UPDATED',
        entity_type: table,
        entity_id: updateId,
        before_state: prevData ? (prevData as never) : null,
        after_state: updated ? (updated as never) : null,
      });

      if (auditError) {
        // Rollback database mutation to prevent un-audited state
        await tableQuery.update(prevData).eq('id', updateId);
        return NextResponse.json(
          { error: 'Audit log insertion failed. Mutation was rolled back to maintain integrity.' },
          { status: 500 },
        );
      }

      // Trigger cache invalidation for published/updated content
      triggerRevalidation(table, body.slug);

      return NextResponse.json({ ok: true, item: updated }, { status: 200 });
    } else {
      // Creation: If creating directly as PUBLISHED or ARCHIVED, enforce ADMIN role
      if (body.status === 'PUBLISHED' || body.status === 'ARCHIVED') {
        await requireMinimumRole('ADMIN');
      }

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
      } else if (table === 'insights') {
        insertPayload.body = {
          abstract: body.summary || '',
          heading: 'Core Architecture',
          paragraphs: [body.summary || ''],
        };
      } else {
        insertPayload.summary = body.summary || null;
      }

      const { data: inserted, error: insertError } = await tableQuery
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      const insertedId = (inserted as { id: string }).id;

      // Append-only audit log with transactional rollback guard
      const { error: auditError } = await db.from('audit_logs').insert({
        actor_type: 'STAFF',
        actor_id: staff.id,
        action: body.status === 'PUBLISHED' ? 'CONTENT_PUBLISHED' : 'CONTENT_CREATED',
        entity_type: table,
        entity_id: insertedId,
        after_state: inserted ? (inserted as never) : null,
      });

      if (auditError) {
        // Rollback creation to prevent un-audited state
        await tableQuery.delete().eq('id', insertedId);
        return NextResponse.json(
          { error: 'Audit log insertion failed. Mutation was rolled back to maintain integrity.' },
          { status: 500 },
        );
      }

      // Trigger cache invalidation if published
      if (body.status === 'PUBLISHED') {
        triggerRevalidation(table, body.slug);
      }

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
