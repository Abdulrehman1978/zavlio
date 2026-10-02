import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { createHmac, randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret =
  process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long';
const admin = serviceKey
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
const suffix = Date.now().toString(36);
const fixtures = new Map<string, { userId: string; profileId?: string; email: string }>();
let personId = '';
let opportunityId = '';
let taskId = '';
let visitorId = '';
let sessionId = '';
let formId = '';
const eventIds: string[] = [];
let qualifiedStageId = '';
let lostStageId = '';
let newStageId = '';

function token(userId: string) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    aud: 'authenticated',
    role: 'authenticated',
    sub: userId,
    iss: url + '/auth/v1',
    iat: now,
    exp: now + 3600,
  });
  const input = header + '.' + payload;
  return input + '.' + createHmac('sha256', secret).update(input).digest('base64url');
}

async function signIn(page: Page, role: string, next: string) {
  const fixture = fixtures.get(role);
  if (!fixture) throw new Error(role + ' fixture missing');
  const session = {
    access_token: token(fixture.userId),
    refresh_token: 'packet-11-e2e-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  };
  await page.context().addCookies([
    {
      name: 'sb-127-auth-token',
      value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
  await page.goto(next);
}

async function createStaff(role: 'ADMIN' | 'OPERATOR' | 'VIEWER') {
  if (!admin) throw new Error('Operations E2E requires SUPABASE_SERVICE_ROLE_KEY');
  const email = 'packet11-' + role.toLowerCase() + '-' + suffix + '@example.test';
  const user = await admin.auth.admin.createUser({
    email,
    password: 'Packet11-E2E-Password-123!',
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error('user fixture failed');
  const profile = await admin
    .from('staff_profiles')
    .insert({
      auth_user_id: user.data.user.id,
      email,
      name: 'Packet 11 ' + role,
      role,
      active: true,
    })
    .select('id')
    .single();
  if (profile.error) throw profile.error;
  fixtures.set(role, { userId: user.data.user.id, profileId: profile.data.id, email });
}

async function createNonstaff() {
  if (!admin) throw new Error('Operations E2E requires SUPABASE_SERVICE_ROLE_KEY');
  const email = 'packet12-nonstaff-' + suffix + '@example.test';
  const user = await admin.auth.admin.createUser({
    email,
    password: 'Packet12-E2E-Password-123!',
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error('nonstaff fixture failed');
  fixtures.set('NONSTAFF', { userId: user.data.user.id, email });
}

test.beforeAll(async () => {
  if (!admin) throw new Error('Operations E2E requires SUPABASE_SERVICE_ROLE_KEY');
  await createStaff('ADMIN');
  await createStaff('OPERATOR');
  await createStaff('VIEWER');
  await createNonstaff();
  const person = await admin
    .from('people')
    .insert({
      display_name: 'Packet 11 Known Lead',
      first_name: 'Packet',
      last_name: 'Eleven',
      primary_email: 'packet11-lead-' + suffix + '@example.test',
      lifecycle_stage: 'QUALIFIED',
      lead_status: 'WARM',
    })
    .select('id')
    .single();
  if (person.error) throw person.error;
  personId = person.data.id;
  const visitor = await admin
    .from('anonymous_visitors')
    .insert({ visitor_key: randomUUID(), linked_person_id: personId })
    .select('id')
    .single();
  if (visitor.error) throw visitor.error;
  visitorId = visitor.data.id;
  const session = await admin
    .from('sessions')
    .insert({ visitor_id: visitorId, person_id: personId })
    .select('id')
    .single();
  if (session.error) throw session.error;
  sessionId = session.data.id;
  const events = await admin
    .from('events')
    .insert([
      {
        visitor_id: visitorId,
        session_id: sessionId,
        person_id: personId,
        event_name: 'service_viewed',
        page_path: '/services/web',
        metadata: { serviceKey: 'web' },
      },
      {
        visitor_id: visitorId,
        session_id: sessionId,
        person_id: personId,
        event_name: 'page_viewed',
        page_path: '/',
        metadata: {},
      },
    ])
    .select('id');
  if (events.error) throw events.error;
  eventIds.push(...events.data.map((row) => row.id));
  const form = await admin
    .from('form_submissions')
    .insert({
      person_id: personId,
      form_type: 'START_A_PROJECT',
      payload: { services: ['web', 'ai_automation'], budget: '100000' },
      status: 'PROCESSED',
      idempotency_key: randomUUID(),
    })
    .select('id')
    .single();
  if (form.error) throw form.error;
  formId = form.data.id;
  const score = await admin.from('lead_scores').insert({
    person_id: personId,
    score: 66,
    intent_level: 'WARM',
    service_interest: {
      primary: 'web',
      secondary: 'ai_automation',
      declared: { web: 50, ai_automation: 50 },
      behavioral: { web: 15 },
      combined: { web: 75, ai_automation: 60 },
    },
    reasoning: { components: [{ key: 'project_form_submitted', effectivePoints: 40 }] },
    model_version: 'ZAVLIO_LEAD_V1',
  });
  if (score.error) throw score.error;
  const stages = await admin.from('pipeline_stages').select('id,slug');
  if (stages.error) throw stages.error;
  const bySlug = new Map(stages.data.map((stage) => [stage.slug, stage.id]));
  newStageId = bySlug.get('new') ?? '';
  qualifiedStageId = bySlug.get('qualified') ?? bySlug.get('proposal') ?? '';
  lostStageId = bySlug.get('lost') ?? '';
  const opportunity = await admin
    .from('opportunities')
    .insert({
      person_id: personId,
      title: 'Packet 11 Browser Opportunity',
      stage_id: newStageId,
      owner_id: fixtures.get('OPERATOR')?.profileId,
      estimated_value: 250000,
      currency: 'INR',
    })
    .select('id')
    .single();
  if (opportunity.error) throw opportunity.error;
  opportunityId = opportunity.data.id;
  const task = await admin
    .from('tasks')
    .insert({
      person_id: personId,
      opportunity_id: opportunityId,
      assigned_to: fixtures.get('OPERATOR')?.profileId,
      title: 'Packet 11 Browser Task',
      priority: 'HIGH',
      due_at: new Date(Date.now() - 3600000).toISOString(),
    })
    .select('id')
    .single();
  if (task.error) throw task.error;
  taskId = task.data.id;
});

test.afterAll(async () => {
  if (!admin) return;
  if (opportunityId) await admin.from('audit_logs').delete().eq('entity_id', opportunityId);
  if (taskId) await admin.from('audit_logs').delete().eq('entity_id', taskId);
  if (opportunityId)
    await admin.from('opportunity_stage_history').delete().eq('opportunity_id', opportunityId);
  if (opportunityId) await admin.from('tasks').delete().eq('opportunity_id', opportunityId);
  if (opportunityId) await admin.from('opportunities').delete().eq('id', opportunityId);
  if (personId) await admin.from('lead_scores').delete().eq('person_id', personId);
  if (formId) await admin.from('form_submissions').delete().eq('id', formId);
  if (eventIds.length) await admin.from('events').delete().in('id', eventIds);
  if (sessionId) await admin.from('sessions').delete().eq('id', sessionId);
  if (visitorId) await admin.from('anonymous_visitors').delete().eq('id', visitorId);
  if (personId) await admin.from('people').delete().eq('id', personId);
  for (const fixture of [...fixtures.values()].reverse()) {
    if (fixture.profileId) await admin.from('staff_profiles').delete().eq('id', fixture.profileId);
    await admin.auth.admin.deleteUser(fixture.userId);
  }
});

test('operator runs pipeline, stage, task, and score workflows accessibly', async ({ page }) => {
  await signIn(page, 'OPERATOR', '/crm/pipeline?q=Packet%2011%20Browser');
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Packet 11 Browser Opportunity' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Packet 11 Browser Opportunity' }).click();
  await expect(page.getByRole('heading', { name: 'Packet 11 Browser Opportunity' })).toBeVisible();
  await page.getByLabel('Move stage').selectOption(qualifiedStageId);
  await page.getByRole('button', { name: 'Move opportunity' }).click();
  await expect(page.locator('.crm-badge').filter({ hasText: 'Qualified' })).toBeVisible();
  await expect(page.getByText('New → Qualified', { exact: true })).toBeVisible();
  await page.getByLabel('Create linked task').fill('Packet 11 Created In Browser');
  await page
    .getByLabel('Assignee')
    .last()
    .selectOption(fixtures.get('OPERATOR')?.profileId ?? '');
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText('Packet 11 Created In Browser', { exact: true })).toBeVisible();
  await page.goto('/crm/tasks?scope=all');
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Packet 11 Browser Task' });
  await row.getByRole('combobox').first().selectOption('COMPLETED');
  await Promise.all([
    page.waitForNavigation(),
    row.getByRole('button', { name: 'Update' }).click(),
  ]);
  await page.goto('/crm/tasks?scope=completed');
  await expect(page.getByRole('row').filter({ hasText: 'Packet 11 Browser Task' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto('/crm/people/' + personId);
  await expect(page.getByText('66 · WARM')).toBeVisible();
  await expect(page.getByText('Primary interest: web', { exact: true })).toBeVisible();
  await expect(page.getByText('Secondary interest: ai_automation', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recalculate lead score' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  await expect(page.getByText('66 · WARM')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('admin enforces Lost reason and can reopen a closed opportunity', async ({ page }) => {
  await signIn(page, 'ADMIN', '/crm/opportunities/' + opportunityId);
  await page.getByLabel('Move stage').selectOption(lostStageId);
  await page.getByRole('button', { name: 'Move opportunity' }).click();
  await expect(page.getByText('Unable to move opportunity.')).toBeVisible();
  await page.getByLabel(/Lost reason/).selectOption('TIMING');
  await page.getByRole('button', { name: 'Move opportunity' }).click();
  await expect(page.locator('.crm-badge').filter({ hasText: 'Lost' })).toBeVisible();
  await page.getByLabel('Move stage').selectOption(newStageId);
  await page.getByRole('button', { name: 'Move opportunity' }).click();
  await expect(page.locator('.crm-badge').filter({ hasText: 'New' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lead scoring' })).toBeVisible();
});

test('viewer has read-only operations and direct mutation is denied', async ({ page }) => {
  await signIn(page, 'VIEWER', '/crm/opportunities/' + opportunityId);
  await expect(page.getByRole('heading', { name: 'Packet 11 Browser Opportunity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Opportunity actions' })).toHaveCount(0);
  const response = await page.request.post(
    '/api/crm/opportunities/' + opportunityId + '/transition',
    {
      data: { targetStageId: qualifiedStageId, expectedUpdatedAt: new Date().toISOString() },
    },
  );
  expect(response.status()).toBe(403);
  await page.goto('/crm/tasks?scope=all');
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update' })).toHaveCount(0);
});

test('operations routes remain usable without whole-page overflow at mobile width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'OPERATOR', '/crm/pipeline?q=Packet%2011%20Browser');
  for (const path of [
    '/crm/pipeline?q=Packet%2011%20Browser',
    '/crm/opportunities/' + opportunityId,
    '/crm/tasks?scope=all',
    '/crm/people/' + personId,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            element.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
        )
        .slice(0, 5)
        .map((element) => element.className || element.tagName),
    }));
    expect(overflow, path + ' ' + JSON.stringify(overflow)).toMatchObject({ overflow: false });
  }
});

test('viewer can inspect every analytics section, switch ranges, and use exact tables', async ({
  page,
}) => {
  await signIn(page, 'VIEWER', '/crm/analytics');
  await expect(page.getByRole('heading', { name: 'CRM analytics' })).toBeVisible();
  await expect(page.getByText(/Consent scope:/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tracked visitor funnel' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Exact activity trend values' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Range').selectOption('7d');
  await page.getByRole('button', { name: 'Apply range' }).click();
  await expect(page).toHaveURL(/range=7d/);
  for (const [tab, heading] of [
    ['acquisition', 'First-touch acquisition'],
    ['leads', 'Current score distribution'],
    ['pipeline', 'Current pipeline snapshot'],
    ['operations', 'Operational workload by assignee'],
  ] as const) {
    await page.goto(`/crm/analytics?tab=${tab}&range=30d`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('nonstaff is denied analytics while VIEWER retains read access', async ({ page }) => {
  await signIn(page, 'NONSTAFF', '/crm/analytics');
  await expect(page).toHaveURL(/\/auth\/error\?code=forbidden/);
  await page.context().clearCookies();
  await signIn(page, 'VIEWER', '/crm/analytics?tab=operations');
  await expect(page.getByRole('heading', { name: 'CRM analytics' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Operational workload by assignee' }),
  ).toBeVisible();
});

test('analytics remains usable at 390 by 844 without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'VIEWER', '/crm/analytics?tab=acquisition&range=30d');
  await expect(page.getByRole('heading', { name: 'CRM analytics' })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow).toMatchObject({ overflow: false });
});
