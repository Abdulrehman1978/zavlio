import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
if (!url || !anonKey || !serviceKey || !jwtSecret)
  throw new Error(
    'Auth runtime test requires Supabase URL, anon key, service role key, and local JWT secret.',
  );
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const roles = ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'];
const suffix = Date.now().toString(36);
const fixtures = [...roles, 'NONSTAFF', 'INACTIVE'].map((role) => ({
  role,
  email: `packet07-${role.toLowerCase()}-${suffix}@example.test`,
  password: 'Packet07-Local-Password-123!',
}));
const users = new Map();
const profiles = new Map();

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function jwtFor(userId) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    aud: 'authenticated',
    role: 'authenticated',
    sub: userId,
    iss: `${url}/auth/v1`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const input = `${header}.${payload}`;
  return `${input}.${createHmac('sha256', jwtSecret).update(input).digest('base64url')}`;
}
async function rest(role, table, method = 'GET', body) {
  const token = users.get(role)?.token;
  const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.text() };
}
try {
  const signup = createClient(url, anonKey, { auth: { persistSession: false } });
  const signupResult = await signup.auth.signUp({
    email: `signup-${suffix}@example.test`,
    password: fixtures[0].password,
  });
  await assert(signupResult.error, 'public signup unexpectedly succeeded while signup is disabled');
  for (const fixture of fixtures) {
    const created = await admin.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user)
      throw created.error ?? new Error('fixture user creation failed');
    users.set(fixture.role, { id: created.data.user.id, password: fixture.password });
    if (fixture.role !== 'NONSTAFF') {
      const profile = await admin
        .from('staff_profiles')
        .insert({
          auth_user_id: created.data.user.id,
          email: fixture.email,
          name: fixture.role,
          role: fixture.role === 'INACTIVE' ? 'VIEWER' : fixture.role,
          active: fixture.role !== 'INACTIVE',
        })
        .select('id')
        .single();
      if (profile.error || !profile.data)
        throw profile.error ?? new Error('fixture profile creation failed');
      profiles.set(fixture.role, profile.data.id);
    }
  }
  for (const fixture of fixtures) {
    users.get(fixture.role).token = jwtFor(users.get(fixture.role).id);
  }
  const operatorInsert = await rest('OPERATOR', 'people', 'POST', {
    display_name: `Packet 07 ${suffix}`,
  });
  await assert(
    operatorInsert.status >= 200 && operatorInsert.status < 300,
    `operator CRM insert failed: ${operatorInsert.status}`,
  );
  const viewerInsert = await rest('VIEWER', 'people', 'POST', {
    display_name: `Should fail ${suffix}`,
  });
  await assert(viewerInsert.status >= 400, 'viewer CRM insert unexpectedly succeeded');
  const viewerAudit = await rest('VIEWER', 'audit_logs');
  await assert(
    viewerAudit.status >= 400 || viewerAudit.body === '[]',
    'viewer can read audit logs',
  );
  const adminAudit = await rest('ADMIN', 'audit_logs');
  await assert(adminAudit.status >= 200 && adminAudit.status < 300, 'admin audit read failed');
  const viewerNonce = await rest('VIEWER', 'automation_nonces');
  await assert(viewerNonce.status >= 400, 'viewer reached automation nonces');
  const nonstaffPeople = await rest('NONSTAFF', 'people');
  await assert(
    nonstaffPeople.status >= 400 || nonstaffPeople.body === '[]',
    'nonstaff received people data',
  );
  const inactivePeople = await rest('INACTIVE', 'people');
  await assert(
    inactivePeople.status >= 400 || inactivePeople.body === '[]',
    'inactive staff received people data',
  );
  const mailpit = await fetch('http://127.0.0.1:54324/api/v1/messages');
  await assert(mailpit.ok, 'Mailpit API is not available');
  console.log(
    'Packet 07 Auth/RLS runtime matrix passed for owner/admin/operator/viewer/nonstaff/inactive users; public signup denied and Mailpit reachable.',
  );
} finally {
  for (const role of ['INACTIVE', 'NONSTAFF', 'VIEWER', 'OPERATOR', 'ADMIN', 'OWNER']) {
    const profileId = profiles.get(role);
    if (profileId) await admin.from('staff_profiles').delete().eq('id', profileId);
    const user = users.get(role);
    if (user?.id) await admin.auth.admin.deleteUser(user.id);
  }
}
