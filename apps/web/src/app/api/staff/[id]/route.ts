import { NextResponse } from 'next/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { requireRole, roleCanInvite, type StaffRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

const validRoles = new Set<StaffRole>(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireRole('OWNER', 'ADMIN');
  const { id } = await context.params;
  if (id === actor.staff.id)
    return NextResponse.redirect(new URL('/crm/settings/staff?status=self', request.url));
  const admin = createAdminDatabaseClient();
  const { data: target } = await admin
    .from('staff_profiles')
    .select('id,auth_user_id,name,email,role,active')
    .eq('id', id)
    .maybeSingle();
  if (!target)
    return NextResponse.redirect(new URL('/crm/settings/staff?status=missing', request.url));
  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const nextRole = String(form.get('role') ?? target.role) as StaffRole;
  if (target.role === 'OWNER' && actor.staff.role !== 'OWNER')
    return NextResponse.redirect(new URL('/crm/settings/staff?status=forbidden', request.url));
  if (actor.staff.role === 'ADMIN' && (target.role === 'ADMIN' || target.role === 'OWNER'))
    return NextResponse.redirect(new URL('/crm/settings/staff?status=forbidden', request.url));
  if (
    action === 'role' &&
    (!validRoles.has(nextRole) || !roleCanInvite(actor.staff.role, nextRole))
  )
    return NextResponse.redirect(new URL('/crm/settings/staff?status=forbidden', request.url));
  const changes =
    action === 'deactivate'
      ? { active: false }
      : action === 'activate'
        ? { active: true }
        : action === 'role'
          ? { role: nextRole }
          : null;
  if (!changes)
    return NextResponse.redirect(new URL('/crm/settings/staff?status=invalid', request.url));
  const supabase = await createServerSupabaseClient();
  const { data: updated, error } = await supabase
    .from('staff_profiles')
    .update(changes)
    .eq('id', id)
    .select('id,role,active')
    .single();
  if (error || !updated)
    return NextResponse.redirect(new URL('/crm/settings/staff?status=forbidden', request.url));
  await admin.from('audit_logs').insert({
    actor_type: 'STAFF',
    actor_id: actor.staff.id,
    action: `STAFF_${action.toUpperCase()}`,
    entity_type: 'STAFF_PROFILE',
    entity_id: id,
    before_state: { role: target.role, active: target.active },
    after_state: { role: updated.role, active: updated.active },
    request_id: crypto.randomUUID(),
  });
  return NextResponse.redirect(new URL('/crm/settings/staff?status=updated', request.url));
}
