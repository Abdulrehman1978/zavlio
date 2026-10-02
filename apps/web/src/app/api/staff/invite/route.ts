import { NextResponse } from 'next/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { requireRole, roleCanInvite, type StaffRole } from '../../../../lib/auth/guards';
import { publicEnv } from '../../../../lib/env/public';

const validRoles = new Set<StaffRole>(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']);
const back = (request: Request, status: string) =>
  NextResponse.redirect(new URL(`/crm/settings/staff?status=${status}`, request.url));

export async function POST(request: Request) {
  const actor = await requireRole('OWNER', 'ADMIN');
  const form = await request.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const name = String(form.get('name') ?? '').trim();
  const role = String(form.get('role') ?? 'VIEWER') as StaffRole;
  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    name.length < 2 ||
    name.length > 120 ||
    !validRoles.has(role) ||
    !roleCanInvite(actor.staff.role, role)
  )
    return back(request, 'invalid');
  const db = createAdminDatabaseClient();
  const { data: existing } = await db
    .from('staff_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return back(request, 'exists');
  const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.users.some((user) => user.email?.toLowerCase() === email))
    return back(request, 'exists');
  const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/auth/set-password`,
  });
  if (inviteError || !invited.user) {
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: actor.staff.id,
      action: 'STAFF_INVITE_FAILED',
      entity_type: 'STAFF_PROFILE',
      after_state: { email, role },
      request_id: crypto.randomUUID(),
    });
    return back(request, 'failed');
  }
  const { data: profile, error: profileError } = await db
    .from('staff_profiles')
    .insert({ auth_user_id: invited.user.id, email, name, role, active: true })
    .select('id')
    .single();
  if (profileError || !profile) {
    await db.auth.admin.deleteUser(invited.user.id);
    await db.from('audit_logs').insert({
      actor_type: 'STAFF',
      actor_id: actor.staff.id,
      action: 'STAFF_INVITE_COMPENSATED',
      entity_type: 'STAFF_PROFILE',
      after_state: { email, role },
      request_id: crypto.randomUUID(),
    });
    return back(request, 'failed');
  }
  await db.from('audit_logs').insert({
    actor_type: 'STAFF',
    actor_id: actor.staff.id,
    action: 'STAFF_INVITED',
    entity_type: 'STAFF_PROFILE',
    entity_id: profile.id,
    after_state: { email, role },
    request_id: crypto.randomUUID(),
  });
  return back(request, 'invited');
}
