import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: 'qa-owner@example.test',
    password: 'Qa-Owner-Pass-2026!',
    role: 'OWNER',
    active: true,
    name: 'QA Owner',
  },
  {
    email: 'qa-admin@example.test',
    password: 'Qa-Admin-Pass-2026!',
    role: 'ADMIN',
    active: true,
    name: 'QA Admin',
  },
  {
    email: 'qa-operator@example.test',
    password: 'Qa-Operator-Pass-2026!',
    role: 'OPERATOR',
    active: true,
    name: 'QA Operator',
  },
  {
    email: 'qa-viewer@example.test',
    password: 'Qa-Viewer-Pass-2026!',
    role: 'VIEWER',
    active: true,
    name: 'QA Viewer',
  },
  {
    email: 'qa-inactive@example.test',
    password: 'Qa-Inactive-Pass-2026!',
    role: 'VIEWER',
    active: false,
    name: 'QA Inactive',
  },
  {
    email: 'qa-nonstaff@example.test',
    password: 'Qa-Nonstaff-Pass-2026!',
    role: null,
    active: false,
    name: 'QA Nonstaff',
  },
];

async function main() {
  console.log('Provisioning QA users...');
  for (const u of users) {
    const listRes = await admin.auth.admin.listUsers();
    let existing = listRes.data?.users.find((x) => x.email === u.email);

    let userId = existing?.id;
    if (!existing) {
      const created = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (created.error) {
        console.error('Error creating user:', u.email, created.error);
        continue;
      }
      userId = created.data.user.id;
      console.log('Created user:', u.email, userId);
    } else {
      await admin.auth.admin.updateUserById(userId, { password: u.password, email_confirm: true });
      console.log('User exists, updated password:', u.email);
    }

    if (u.role) {
      const { data: profile } = await admin
        .from('staff_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (profile) {
        await admin
          .from('staff_profiles')
          .update({
            role: u.role,
            is_active: u.active,
            display_name: u.name,
          })
          .eq('id', profile.id);
        console.log('Updated staff profile for:', u.email, u.role, 'active:', u.active);
      } else {
        await admin.from('staff_profiles').insert({
          auth_user_id: userId,
          role: u.role,
          is_active: u.active,
          display_name: u.name,
        });
        console.log('Created staff profile for:', u.email, u.role, 'active:', u.active);
      }
    } else {
      // nonstaff: remove staff profile if exists
      await admin.from('staff_profiles').delete().eq('auth_user_id', userId);
      console.log('Ensured no staff profile for nonstaff:', u.email);
    }
  }
  console.log('QA user provisioning complete.');
}

main().catch(console.error);
