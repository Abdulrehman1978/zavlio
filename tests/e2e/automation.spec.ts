import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { createHmac, randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
test.describe.configure({ mode: 'serial' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  service = process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret =
    process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long',
  admin = service ? createClient(url, service, { auth: { persistSession: false } }) : null,
  suffix = Date.now().toString(36),
  fixtures = new Map<string, { userId: string; profileId: string; token: string }>();
let blockedId = '';
let manualId = '';
const jwt = (id: string) => {
  const e = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url'),
    n = Math.floor(Date.now() / 1000),
    h = e({ alg: 'HS256', typ: 'JWT' }),
    p = e({
      aud: 'authenticated',
      role: 'authenticated',
      sub: id,
      iss: url + '/auth/v1',
      iat: n,
      exp: n + 3600,
    }),
    x = h + '.' + p;
  return x + '.' + createHmac('sha256', secret).update(x).digest('base64url');
};
async function staff(role: 'OWNER' | 'ADMIN' | 'VIEWER') {
  if (!admin) throw new Error('Automation E2E requires service key');
  const email = 'packet13-e2e-' + role.toLowerCase() + '-' + suffix + '@example.test',
    u = await admin.auth.admin.createUser({
      email,
      password: 'Packet13-E2E-Password-123!',
      email_confirm: true,
    });
  if (u.error || !u.data.user) throw u.error;
  const p = await admin
    .from('staff_profiles')
    .insert({ auth_user_id: u.data.user.id, email, name: 'Packet 13 ' + role, role, active: true })
    .select('id')
    .single();
  if (p.error) throw p.error;
  fixtures.set(role, { userId: u.data.user.id, profileId: p.data.id, token: jwt(u.data.user.id) });
}
async function rpc(role: string, name: string, args: Record<string, unknown>) {
  const r = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      Authorization: 'Bearer ' + fixtures.get(role)?.token,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  return { status: r.status, body: await r.json() };
}
async function signIn(page: Page, role: string, next: string) {
  const f = fixtures.get(role)!;
  const session = {
    access_token: f.token,
    refresh_token: 'packet13-e2e-refresh',
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
test.beforeAll(async () => {
  if (!admin) throw new Error('Automation E2E requires service key');
  const stale = await admin
    .from('automation_jobs')
    .update({ status: 'CANCELLED', claimed_by: null, claimed_at: null, lease_expires_at: null })
    .in('status', ['AWAITING_APPROVAL', 'QUEUED', 'CLAIMED', 'RUNNING', 'MANUAL_ACTION_REQUIRED']);
  if (stale.error) throw stale.error;
  await staff('OWNER');
  await staff('ADMIN');
  await staff('VIEWER');
  const config = {
    enabled: true,
    dryRun: true,
    approvalRequired: true,
    allowedChannels: ['EMAIL'],
    allowedActions: ['SEND_EMAIL'],
    allowedPurposes: ['MARKETING'],
    workingHours: {
      enabled: false,
      timezone: 'Asia/Kolkata',
      weekdays: [1, 2, 3, 4, 5],
      start: '09:00',
      end: '18:00',
    },
    cooldownMinutes: 60,
    personDailyCap: 2,
    personWeeklyCap: 5,
    channelHourlyCaps: {},
    actionHourlyCaps: {},
    duplicateWindowMinutes: 60,
    approvalValidityMinutes: 60,
    leaseSeconds: 300,
    maxAttempts: 3,
    retryBackoffSeconds: [60, 300, 1800],
  };
  const active = await rpc('OWNER', 'activate_automation_policy', {
    p_configuration: config,
    p_name: 'Packet 13 browser',
  });
  if (active.status !== 200) throw new Error('policy activation failed');
  for (const [label, dnc] of [
    ['Approval', false],
    ['DNC', true],
  ] as const) {
    const p = await admin
      .from('people')
      .insert({
        display_name: 'Packet 13 ' + label,
        primary_email: 'packet13-' + label.toLowerCase() + '-' + suffix + '@example.test',
        do_not_contact: dnc,
      })
      .select('id')
      .single();
    await admin.from('consents').insert({
      person_id: p.data.id,
      marketing_email: true,
      policy_version: 'packet13-e2e',
      source: 'E2E',
    });
    const job = await rpc('ADMIN', 'propose_automation_job', {
      p_person_id: p.data.id,
      p_opportunity_id: null,
      p_channel: 'EMAIL',
      p_action: 'SEND_EMAIL',
      p_purpose: 'MARKETING',
      p_payload: { schemaVersion: 1, text: 'Reviewed browser dry run' },
      p_idempotency_key: randomUUID(),
      p_source_reference: 'e2e',
      p_scheduled_for: new Date().toISOString(),
      p_priority: 0,
    });
    if (label === 'DNC') blockedId = job.body[0].id;
  }
  const manualPerson = await admin
    .from('people')
    .insert({
      display_name: 'Packet 13 Manual',
      primary_email: 'packet13-manual-' + suffix + '@example.test',
    })
    .select('id')
    .single();
  await admin.from('consents').insert({
    person_id: manualPerson.data.id,
    marketing_email: true,
    policy_version: 'packet13-e2e',
    source: 'E2E',
  });
  const proposed = await rpc('ADMIN', 'propose_automation_job', {
    p_person_id: manualPerson.data.id,
    p_opportunity_id: null,
    p_channel: 'EMAIL',
    p_action: 'SEND_EMAIL',
    p_purpose: 'MARKETING',
    p_payload: { schemaVersion: 1, text: 'Manual checkpoint dry run' },
    p_idempotency_key: randomUUID(),
    p_source_reference: 'e2e-manual',
    p_scheduled_for: new Date().toISOString(),
    p_priority: 10,
  });
  const approved = await rpc('ADMIN', 'approve_automation_job', {
    p_job_id: proposed.body[0].id,
    p_expected_version: proposed.body[0].version,
  });
  manualId = approved.body[0].id;
  const agent = await admin
    .from('automation_agents')
    .insert({
      agent_key: 'packet13-e2e-' + suffix,
      name: 'Packet 13 Browser Agent',
      enabled: true,
      status: 'ONLINE',
      last_heartbeat_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  await admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 });
  await admin.rpc('start_automation_job', {
    p_job_id: manualId,
    p_agent_id: agent.data.id,
  });
  await admin.rpc('fail_automation_job', {
    p_job_id: manualId,
    p_agent_id: agent.data.id,
    p_code: 'SECURITY_CHECKPOINT',
    p_summary: 'Synthetic browser checkpoint',
    p_retry_at: null,
  });
  await admin.from('automation_agents').insert({
    agent_key: 'packet14-e2e-' + suffix,
    name: 'Packet 14 Protocol Agent',
    enabled: true,
    status: 'ONLINE',
    last_heartbeat_at: new Date().toISOString(),
    protocol_version: 1,
    bridge_version: '14.0.0-e2e',
    executor_mode: 'DRY_RUN_ONLY',
    instance_id: randomUUID(),
    last_handshake_at: new Date().toISOString(),
    clock_skew_ms: 12,
    capabilities: {
      channels: ['INTERNAL'],
      actions: ['NOOP'],
      executionModes: ['DRY_RUN_ONLY'],
    },
    negotiated_capabilities: {
      channels: ['INTERNAL'],
      actions: ['NOOP'],
      executionModes: ['DRY_RUN_ONLY'],
    },
  });
});
test('ADMIN reviews and approves an eligible dry-run action accessibly', async ({ page }) => {
  await signIn(page, 'ADMIN', '/crm/automation/approvals');
  await expect(page.getByRole('heading', { name: 'Approval queue' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Packet 13 Approval' }).click();
  await expect(page.getByText('Dry run', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Approve reviewed dry-run' }).click();
  await expect(page.locator('.crm-badge')).toContainText('QUEUED');
});
test('DNC job is visibly blocked with no override approval', async ({ page }) => {
  await signIn(page, 'ADMIN', '/crm/automation/jobs/' + blockedId);
  await expect(page.locator('.crm-badge')).toContainText('BLOCKED');
  await expect(page.getByText('DNC_BLOCKED').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Approve/ })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test('VIEWER can inspect status but cannot mutate or open settings', async ({ page }) => {
  await signIn(page, 'VIEWER', '/crm/automation');
  await expect(page.getByRole('heading', { name: 'Automation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Manual dry-run proposal' })).toHaveCount(0);
  await page.goto('/crm/automation/settings');
  await expect(page).toHaveURL(/auth\/error/);
});
test('ADMIN safely resolves a manual-action checkpoint', async ({ page }) => {
  await signIn(page, 'ADMIN', '/crm/automation/jobs/' + manualId);
  await expect(page.locator('.crm-badge')).toContainText('MANUAL_ACTION_REQUIRED');
  await expect(page.getByText('SECURITY_CHECKPOINT').first()).toBeVisible();
  await page.getByLabel('Resolution note').fill('Verified synthetic checkpoint only');
  await page.getByRole('button', { name: 'Record resolution' }).click();
  await expect(page.locator('.crm-badge')).toContainText('QUEUED');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test('automation routes are accessible and mobile-contained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'OWNER', '/crm/automation/agents');
  await expect(page.getByText('Packet 14 Protocol Agent').first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'DRY_RUN_ONLY', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'v1' }).first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.goto('/crm/automation/settings');
  await expect(page.getByRole('heading', { name: 'Automation safety settings' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test.afterAll(async () => {
  if (!admin) return;
  await admin
    .from('automation_policy_versions')
    .update({ active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('automation_policy_versions').update({ active: true }).eq('version', 1);
  await admin.from('automation_agents').delete().like('agent_key', `%${suffix}%`);
  const testEmails = [
    'packet13-approval-' + suffix + '@example.test',
    'packet13-dnc-' + suffix + '@example.test',
    'packet13-manual-' + suffix + '@example.test',
  ];
  const { data: testPeople } = await admin
    .from('people')
    .select('id')
    .in('primary_email', testEmails);
  if (testPeople?.length) {
    const pids = testPeople.map((p) => p.id);
    await admin.from('consents').delete().in('person_id', pids);
    await admin
      .from('automation_job_events')
      .delete()
      .in('job_id', [blockedId, manualId].filter(Boolean));
    await admin
      .from('automation_approvals')
      .delete()
      .in('job_id', [blockedId, manualId].filter(Boolean));
    await admin.from('automation_jobs').delete().in('person_id', pids);
    await admin.from('people').delete().in('id', pids);
  }
  for (const fixture of fixtures.values()) {
    if (fixture.profileId) await admin.from('staff_profiles').delete().eq('id', fixture.profileId);
    await admin.auth.admin.deleteUser(fixture.userId);
  }
});
