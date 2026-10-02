import { createClient } from '@supabase/supabase-js';

const args = new Map(
  process.argv
    .slice(2)
    .flatMap((value, index, values) =>
      value.startsWith('--') ? [[value.slice(2), values[index + 1]]] : [],
    ),
);
const email = String(args.get('email') ?? '')
  .trim()
  .toLowerCase();
const name = String(args.get('name') ?? '').trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || !email || !name)
  throw new Error(
    'Usage: staff:bootstrap-owner --email owner@example.com --name "Owner Name" with Supabase service credentials in the environment.',
  );
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: activeOwner, error: ownerError } = await db
  .from('staff_profiles')
  .select('id,email')
  .eq('role', 'OWNER')
  .eq('active', true)
  .limit(1)
  .maybeSingle();
if (ownerError) throw ownerError;
if (activeOwner) {
  console.log('An active OWNER already exists; bootstrap is idempotently complete.');
} else {
  const { data: existingProfile } = await db
    .from('staff_profiles')
    .select('id,auth_user_id,active')
    .eq('email', email)
    .maybeSingle();
  if (existingProfile) {
    if (existingProfile.active && existingProfile.auth_user_id)
      console.log('The requested owner profile already exists.');
    else
      throw new Error(
        'A profile for this email exists but is not an active linked owner. Resolve it before bootstrapping.',
      );
  } else {
    const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = listed.users.find((candidate) => candidate.email?.toLowerCase() === email);
    let created = false;
    if (!user) {
      const result = await db.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/confirm?next=/auth/set-password`,
      });
      if (result.error || !result.data.user)
        throw result.error ?? new Error('Invite did not return a user.');
      user = result.data.user;
      created = true;
    }
    const { data: profile, error: profileError } = await db
      .from('staff_profiles')
      .insert({ auth_user_id: user.id, email, name, role: 'OWNER', active: true })
      .select('id')
      .single();
    if (profileError || !profile) {
      if (created) await db.auth.admin.deleteUser(user.id);
      throw profileError ?? new Error('Owner profile insert failed.');
    }
    await db.from('audit_logs').insert({
      actor_type: 'SYSTEM',
      actor_id: user.id,
      action: 'OWNER_BOOTSTRAPPED',
      entity_type: 'STAFF_PROFILE',
      entity_id: profile.id,
      after_state: { email, role: 'OWNER' },
      request_id: crypto.randomUUID(),
    });
    console.log('Owner bootstrap completed; invite sent through local/hosted Supabase Auth.');
  }
}
