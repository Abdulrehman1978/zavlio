import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { createHmac } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret =
  process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long';
const password = 'Packet10-E2E-Password-123!';
const suffix = Date.now().toString(36);
const adminEmail = `packet10-admin-${suffix}@example.test`;
const viewerEmail = `packet10-viewer-${suffix}@example.test`;
const admin = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
const fixtureUsers: Array<{ id: string; profileId: string }> = [];

async function createFixture(email: string, role: 'ADMIN' | 'VIEWER') {
  if (!admin) throw new Error('CRM E2E requires SUPABASE_SERVICE_ROLE_KEY');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error('user fixture failed');
  const profile = await admin
    .from('staff_profiles')
    .insert({
      auth_user_id: created.data.user.id,
      email,
      name: `Packet 10 ${role}`,
      role,
      active: true,
    })
    .select('id')
    .single();
  if (profile.error || !profile.data) throw profile.error ?? new Error('profile fixture failed');
  fixtureUsers.push({ id: created.data.user.id, profileId: profile.data.id });
}

function jwtFor(userId: string) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    aud: 'authenticated',
    role: 'authenticated',
    sub: userId,
    iss: `${supabaseUrl}/auth/v1`,
    iat: now,
    exp: now + 3600,
  });
  const input = `${header}.${payload}`;
  return `${input}.${createHmac('sha256', jwtSecret).update(input).digest('base64url')}`;
}

async function signIn(page: Page, userId: string, next: string) {
  // Test-only signed local JWT: local auth disables password login, while production
  // still authenticates exclusively through the normal Supabase cookie session.
  const accessToken = jwtFor(userId);
  const session = {
    access_token: accessToken,
    refresh_token: 'packet10-e2e-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  };
  const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  await page
    .context()
    .addCookies([{ name: 'sb-127-auth-token', value: encoded, domain: '127.0.0.1', path: '/' }]);
  await page.goto(next);
}

test.beforeAll(async () => {
  await createFixture(adminEmail, 'ADMIN');
  await createFixture(viewerEmail, 'VIEWER');
});

test.afterAll(async () => {
  if (!admin) return;
  for (const fixture of fixtureUsers.reverse()) {
    await admin.from('staff_profiles').delete().eq('id', fixture.profileId);
    await admin.auth.admin.deleteUser(fixture.id);
  }
});

test('admin can navigate CRM routes and the pages pass axe checks', async ({ page }) => {
  const fixture = fixtureUsers[0];
  if (!fixture) throw new Error('admin fixture missing');
  await signIn(page, fixture.id, '/crm/people');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Identity review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff settings' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('link', { name: 'Organizations' }).click();
  await expect(page).toHaveURL(/\/crm\/organizations$/);
  await expect(page.getByRole('heading', { name: 'Organizations', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('viewer sees CRM records but not identity review or staff settings', async ({ page }) => {
  const fixture = fixtureUsers[1];
  if (!fixture) throw new Error('viewer fixture missing');
  await signIn(page, fixture.id, '/crm/people');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Identity review' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Staff settings' })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
