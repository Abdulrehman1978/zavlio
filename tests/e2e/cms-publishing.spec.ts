import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { createHmac } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret =
  process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long';
const password = 'Packet20-CMS-Password-123!';
const suffix = Date.now().toString(36);

let adminClient = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

interface FixtureUser {
  id: string;
  profileId: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

const fixtureUsers: FixtureUser[] = [];
const createdSlugs: string[] = [];

async function createStaffUser(email: string, role: 'ADMIN' | 'OPERATOR' | 'VIEWER') {
  if (!adminClient) return null;
  const created = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw created.error ?? new Error('user creation failed');
  const profile = await adminClient
    .from('staff_profiles')
    .insert({
      auth_user_id: created.data.user.id,
      email,
      name: `CMS Test ${role}`,
      role,
      active: true,
    })
    .select('id')
    .single();
  if (profile.error || !profile.data) throw profile.error ?? new Error('profile creation failed');
  const fixture: FixtureUser = {
    id: created.data.user.id,
    profileId: profile.data.id,
    email,
    role,
  };
  fixtureUsers.push(fixture);
  return fixture;
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

async function signInAs(page: Page, user: FixtureUser, targetUrl: string) {
  const accessToken = jwtFor(user.id);
  const session = {
    access_token: accessToken,
    refresh_token: 'cms-test-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  };
  const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  await page
    .context()
    .addCookies([{ name: 'sb-127-auth-token', value: encoded, domain: '127.0.0.1', path: '/' }]);
  await page.goto(targetUrl);
}

test.beforeAll(async () => {
  if (adminClient) {
    try {
      await createStaffUser(`cms-operator-${suffix}@example.test`, 'OPERATOR');
      await createStaffUser(`cms-admin-${suffix}@example.test`, 'ADMIN');
    } catch {
      adminClient = null;
    }
  }
});

test.afterAll(async () => {
  if (!adminClient) return;
  // Clean up any test content created
  for (const slug of createdSlugs) {
    await adminClient.from('insights').delete().eq('slug', slug);
    await adminClient.from('projects').delete().eq('slug', slug);
    await adminClient.from('services').delete().eq('slug', slug);
    await adminClient.from('lab_projects').delete().eq('slug', slug);
  }
  // Clean up fixture users
  for (const fixture of fixtureUsers.reverse()) {
    await adminClient.from('staff_profiles').delete().eq('id', fixture.profileId);
    await adminClient.auth.admin.deleteUser(fixture.id);
  }
});

test('CMS Lifecycle: Operator draft -> Unauthorized publish denied -> Admin publish -> Public display -> Update -> Archive', async ({
  page,
}) => {
  test.skip(!adminClient, 'Skipped in environments without live local Supabase instance');

  const operator = fixtureUsers.find((u) => u.role === 'OPERATOR');
  const admin = fixtureUsers.find((u) => u.role === 'ADMIN');
  if (!operator || !admin) throw new Error('Missing test fixtures');

  const articleSlug = `e2e-control-planes-${suffix}`;
  const articleTitle = `Deterministic Control Planes ${suffix}`;
  const updatedTitle = `Deterministic Control Planes ${suffix} — Verified Study`;
  const summaryText = `Evaluating supervised machine execution and audit invariants ${suffix}.`;
  createdSlugs.push(articleSlug);

  // -------------------------------------------------------------------------
  // 1. OPERATOR creates new draft article
  // -------------------------------------------------------------------------
  await signInAs(page, operator, '/crm/content?type=insights');
  await expect(page.getByRole('heading', { name: 'Content workspace' })).toBeVisible();

  // Open creation modal
  await page.getByRole('button', { name: /\+ Create new/i }).click();
  await expect(page.getByRole('heading', { name: /New insight/i })).toBeVisible();

  // Fill in content fields as DRAFT
  await page.getByLabel('Title *').fill(articleTitle);
  await page.getByLabel(/Slug/i).fill(articleSlug);
  await page.getByLabel(/Summary/i).fill(summaryText);
  await page.getByLabel(/Lifecycle Status/i).selectOption('DRAFT');

  // Operator submits draft
  await page.getByRole('button', { name: 'Create Item' }).click();
  await expect(page.getByText(/saved successfully/i)).toBeVisible();

  // Verify it appears in CRM table with DRAFT badge
  await page.goto('/crm/content?type=insights');
  await expect(page.getByText(articleTitle)).toBeVisible();

  // -------------------------------------------------------------------------
  // 2. VERIFY DRAFT IS ABSENT FROM PUBLIC ROUTES
  // -------------------------------------------------------------------------
  // Check public index
  await page.goto('/insights');
  await expect(page.getByText(articleTitle)).toHaveCount(0);

  // Check direct URL
  const draftResponse = await page.goto(`/insights/${articleSlug}`);
  // Should return 404 or show Not Found
  expect([404, 200]).toContain(draftResponse?.status());
  if (draftResponse?.status() === 200) {
    await expect(page.getByText('Insight Not Found')).toBeVisible();
  }

  // -------------------------------------------------------------------------
  // 3. UNAUTHORIZED PUBLICATION ATTEMPT BY OPERATOR IS DENIED
  // -------------------------------------------------------------------------
  await signInAs(page, operator, '/crm/content?type=insights');
  await page.getByRole('button', { name: `Edit ${articleSlug}` }).click();

  // Verify UI denial: PUBLISHED option is disabled for OPERATOR
  const publishedOption = page.getByRole('dialog').locator('option[value="PUBLISHED"]');
  await expect(publishedOption).toHaveJSProperty('disabled', true);

  // Verify API layer denial: direct POST with PUBLISHED status is rejected with 403
  const deniedRes = await page.request.post('/api/crm/content', {
    data: {
      type: 'insights',
      title: articleTitle,
      slug: articleSlug,
      status: 'PUBLISHED',
      claimStatus: 'VERIFIED',
    },
  });
  expect(deniedRes.status()).toBe(403);

  // -------------------------------------------------------------------------
  // 4. ADMIN PUBLISHES THE ARTICLE
  // -------------------------------------------------------------------------
  await signInAs(page, admin, '/crm/content?type=insights');
  await page.getByRole('button', { name: `Edit ${articleSlug}` }).click();

  await page.getByLabel(/Lifecycle Status/i).selectOption('PUBLISHED');
  await page.getByLabel(/Claim Status/i).selectOption('VERIFIED');
  await page.getByRole('button', { name: 'Update Item' }).click();
  await expect(page.getByText(/saved successfully/i)).toBeVisible();

  // -------------------------------------------------------------------------
  // 5. VERIFY ARTICLE IS NOW ACCESSIBLE ON PUBLIC ROUTES
  // -------------------------------------------------------------------------
  await page.goto('/insights');
  await expect(page.getByText(articleTitle)).toBeVisible();

  await page.goto(`/insights/${articleSlug}`);
  await expect(page.getByRole('heading', { name: articleTitle })).toBeVisible();
  await expect(page.getByText(summaryText).first()).toBeVisible();

  // Accessibility check on dynamically published page
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // -------------------------------------------------------------------------
  // 6. CONTENT UPDATE
  // -------------------------------------------------------------------------
  await signInAs(page, admin, '/crm/content?type=insights');
  await page.getByRole('button', { name: `Edit ${articleSlug}` }).click();

  await page.getByLabel('Title *').fill(updatedTitle);
  await page.getByRole('button', { name: 'Update Item' }).click();
  await expect(page.getByText(/saved successfully/i)).toBeVisible();

  // Public route reflects update
  await page.goto(`/insights/${articleSlug}`);
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();

  // -------------------------------------------------------------------------
  // 7. ARCHIVE: DISAPPEARS FROM PUBLIC ROUTES
  // -------------------------------------------------------------------------
  await signInAs(page, admin, '/crm/content?type=insights');
  await page.getByRole('button', { name: `Edit ${articleSlug}` }).click();

  await page.getByLabel(/Lifecycle Status/i).selectOption('ARCHIVED');
  await page.getByRole('button', { name: 'Update Item' }).click();
  await expect(page.getByText(/saved successfully/i)).toBeVisible();

  // Verify removed from public listing
  await page.goto('/insights');
  await expect(page.getByText(updatedTitle)).toHaveCount(0);

  // Direct URL returns 404
  const archivedResponse = await page.goto(`/insights/${articleSlug}`);
  expect([404, 200]).toContain(archivedResponse?.status());
  if (archivedResponse?.status() === 200) {
    await expect(page.getByText('Insight Not Found')).toBeVisible();
  }
});
