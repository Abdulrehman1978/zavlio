import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { fork, spawn } from 'node:child_process';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anon || !service)
  throw new Error('Packet 14 runtime requires local Supabase credentials.');
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(supabaseUrl))
  throw new Error('Packet 14 runtime is local-only.');

let checks = 0;
const assert = (value, message) => {
  if (!value) throw new Error(message);
  checks += 1;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const admin = createClient(supabaseUrl, service, { auth: { persistSession: false } });
const suffix = Date.now().toString(36);
const controlPlane = 'http://127.0.0.1:3014';
const keyId = 'packet14-current';
const agents = [
  {
    key: `packet14-a-${suffix}`,
    secret: randomBytes(32).toString('base64url'),
    previousSecret: randomBytes(32).toString('base64url'),
  },
  { key: `packet14-b-${suffix}`, secret: randomBytes(32).toString('base64url') },
  { key: `packet14-disabled-${suffix}`, secret: randomBytes(32).toString('base64url') },
];
const childLogs = [];
let web;
let bridge;
let approvalStaffId;

function launch(command, args, env) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => childLogs.push(chunk.toString()));
  return child;
}
function launchModule(modulePath, env) {
  const child = fork(modulePath, [], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    silent: true,
  });
  for (const stream of [child.stdout, child.stderr])
    stream?.on('data', (chunk) => childLogs.push(chunk.toString()));
  return child;
}
async function waitFor(url, accepted = [200], timeout = 45000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const response = await fetch(url);
      if (accepted.includes(response.status)) return response;
    } catch {}
    await delay(300);
  }
  throw new Error(`Timed out waiting for ${url}`);
}
function canonical({ path, agent, keyIdentity, timestamp, nonce, digest }) {
  return ['v1', 'POST', path, agent.key, keyIdentity, timestamp, nonce, digest].join('\n');
}
function signed(agent, path, payload, overrides = {}) {
  const body = overrides.body ?? JSON.stringify(payload);
  const digest = createHash('sha256').update(Buffer.from(body)).digest('hex');
  const timestamp = String(overrides.timestamp ?? Math.floor(Date.now() / 1000));
  const nonce = overrides.nonce ?? randomUUID();
  const keyIdentity = overrides.keyId ?? keyId;
  const signature = createHmac('sha256', Buffer.from(overrides.secret ?? agent.secret, 'base64url'))
    .update(
      canonical({
        path: overrides.signPath ?? path,
        agent,
        keyIdentity,
        timestamp,
        nonce,
        digest: overrides.digest ?? digest,
      }),
    )
    .digest('base64url');
  return {
    body,
    headers: {
      'content-type': 'application/json',
      'x-zavlio-agent-key': agent.key,
      'x-zavlio-key-id': keyIdentity,
      'x-zavlio-protocol-version': '1',
      'x-zavlio-timestamp': timestamp,
      'x-zavlio-nonce': nonce,
      'x-zavlio-content-sha256': overrides.digest ?? digest,
      'x-zavlio-signature': 'v1=' + signature,
      'x-zavlio-bridge-version': '14.0.0-test',
    },
  };
}
async function post(agent, path, payload, overrides) {
  const request = signed(agent, path, payload, overrides);
  const response = await fetch(controlPlane + path + (overrides?.query ?? ''), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });
  return { status: response.status, body: await response.json() };
}
async function insertAgent(agent, enabled = true) {
  const result = await admin
    .from('automation_agents')
    .insert({
      agent_key: agent.key,
      name: agent.key,
      enabled,
      status: 'OFFLINE',
      host: '127.0.0.1',
      capabilities: {
        channels: ['INTERNAL', 'EMAIL'],
        actions: ['NOOP', 'SEND_EMAIL'],
        executionModes: ['DRY_RUN_ONLY'],
      },
    })
    .select('id')
    .single();
  if (result.error) throw result.error;
  agent.id = result.data.id;
}
async function insertJob(label, simulation = 'SUCCESS') {
  const payload = { schemaVersion: 1, text: `Packet 14 ${label}`, simulation };
  const hash = await admin.rpc('automation_payload_hash', { p: payload });
  if (hash.error) throw hash.error;
  const policy = await admin
    .from('automation_policy_versions')
    .select('id,version')
    .eq('active', true)
    .single();
  if (policy.error) throw policy.error;
  const job = await admin
    .from('automation_jobs')
    .insert({
      type: 'NOOP',
      channel: 'INTERNAL',
      communication_purpose: 'INTERNAL',
      action_class: 'INTERNAL_ONLY',
      risk_level: 'LOW',
      priority: 10,
      status: 'QUEUED',
      payload,
      payload_hash: hash.data,
      dry_run: true,
      policy_version_id: policy.data.id,
      idempotency_key: `packet14-${label}-${randomUUID()}`,
      scheduled_for: new Date(Date.now() - 1000).toISOString(),
    })
    .select('id')
    .single();
  if (job.error) throw job.error;
  return job.data.id;
}
async function insertClaimedPolicyJob(
  label,
  agent,
  instanceId,
  purpose = 'MARKETING',
  approvalExpiresAt = new Date(Date.now() + 3600000).toISOString(),
) {
  const person = await admin
    .from('people')
    .insert({
      display_name: `Packet 14 policy ${label}`,
      primary_email: `packet14-${label}-${suffix}-${randomUUID()}@example.test`,
    })
    .select('id')
    .single();
  if (person.error) throw person.error;
  const consent = await admin.from('consents').insert({
    person_id: person.data.id,
    marketing_email: true,
    policy_version: 'packet14-test',
    source: 'PACKET14_RUNTIME',
  });
  if (consent.error) throw consent.error;
  let opportunityId = null;
  if (purpose === 'SALES_FOLLOW_UP') {
    const stage = await admin
      .from('pipeline_stages')
      .select('id')
      .eq('is_closed', false)
      .order('sort_order')
      .limit(1)
      .single();
    if (stage.error) throw stage.error;
    const opportunity = await admin
      .from('opportunities')
      .insert({
        person_id: person.data.id,
        stage_id: stage.data.id,
        title: `Packet 14 ${label}`,
        currency: 'INR',
        source: 'PACKET14_RUNTIME',
      })
      .select('id')
      .single();
    if (opportunity.error) throw opportunity.error;
    opportunityId = opportunity.data.id;
  }
  const payload = { schemaVersion: 1, text: `Packet 14 guarded ${label}` };
  const hash = await admin.rpc('automation_payload_hash', { p: payload });
  if (hash.error) throw hash.error;
  const policy = await admin
    .from('automation_policy_versions')
    .select('id,version')
    .eq('active', true)
    .single();
  if (policy.error) throw policy.error;
  const lease = new Date(Date.now() + 60000).toISOString();
  const job = await admin
    .from('automation_jobs')
    .insert({
      person_id: person.data.id,
      opportunity_id: opportunityId,
      type: 'SEND_EMAIL',
      channel: 'EMAIL',
      communication_purpose: purpose,
      action_class: 'EXTERNAL_SIDE_EFFECT',
      risk_level: 'HIGH',
      status: 'CLAIMED',
      payload,
      payload_hash: hash.data,
      approved_payload_hash: hash.data,
      approval_expires_at: approvalExpiresAt,
      dry_run: true,
      policy_version_id: policy.data.id,
      claimed_by: agent.id,
      claimed_at: new Date().toISOString(),
      lease_expires_at: lease,
      machine_instance_id: instanceId,
      idempotency_key: `packet14-policy-${label}-${randomUUID()}`,
    })
    .select('id,version,lease_expires_at')
    .single();
  if (job.error) throw job.error;
  const approval = await admin
    .from('automation_approvals')
    .insert({
      job_id: job.data.id,
      decision: 'APPROVED',
      decided_by: approvalStaffId,
      policy_version_id: policy.data.id,
      payload_hash: hash.data,
      expires_at: approvalExpiresAt,
    })
    .select('id')
    .single();
  if (approval.error) throw approval.error;
  return {
    jobId: job.data.id,
    personId: person.data.id,
    opportunityId,
    approvalId: approval.data.id,
    jobVersion: job.data.version,
    leaseExpiresAt: job.data.lease_expires_at,
    contentHash: hash.data,
    policyVersion: policy.data.version,
  };
}
function handshakeBody(instanceId, operationId = randomUUID()) {
  return {
    operationId,
    instanceId,
    bridgeVersion: '14.0.0-test',
    supportedProtocolVersions: [1],
    executionModes: ['DRY_RUN_ONLY'],
    capabilities: {
      channels: ['INTERNAL', 'EMAIL'],
      actions: ['NOOP', 'SEND_EMAIL'],
      executionModes: ['DRY_RUN_ONLY'],
    },
    startedAt: new Date().toISOString(),
  };
}
async function stop(child, signal = 'SIGTERM') {
  if (!child || child.exitCode !== null) return;
  child.kill(signal);
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(5000).then(() => child.kill('SIGKILL')),
  ]);
}

const active = await admin
  .from('automation_policy_versions')
  .select('id,configuration,configuration_hash')
  .eq('active', true)
  .single();
if (active.error) throw active.error;
const safePolicy = {
  ...active.data.configuration,
  enabled: true,
  dryRun: true,
  approvalRequired: true,
  allowedChannels: ['INTERNAL', 'EMAIL'],
  allowedActions: ['NOOP', 'SEND_EMAIL'],
  allowedPurposes: ['INTERNAL', 'MARKETING', 'SALES_FOLLOW_UP'],
  workingHours: {
    enabled: false,
    timezone: 'Asia/Kolkata',
    weekdays: [1, 2, 3, 4, 5],
    start: '00:00',
    end: '23:59',
  },
  leaseSeconds: 60,
};

try {
  const staleJobs = await admin
    .from('automation_jobs')
    .update({
      status: 'CANCELLED',
      claimed_by: null,
      claimed_at: null,
      lease_expires_at: null,
      machine_instance_id: null,
    })
    .like('idempotency_key', 'packet14-%')
    .in('status', ['QUEUED', 'CLAIMED', 'RUNNING']);
  if (staleJobs.error) throw staleJobs.error;
  const authUser = await admin.auth.admin.createUser({
    email: `packet14-approver-${suffix}@example.test`,
    password: 'Packet14-Local-Approver-123!',
    email_confirm: true,
  });
  if (authUser.error || !authUser.data.user) throw authUser.error;
  const approver = await admin
    .from('staff_profiles')
    .insert({
      auth_user_id: authUser.data.user.id,
      email: `packet14-approver-${suffix}@example.test`,
      name: 'Packet 14 Runtime Approver',
      role: 'ADMIN',
      active: true,
    })
    .select('id')
    .single();
  if (approver.error) throw approver.error;
  approvalStaffId = approver.data.id;
  for (const [index, agent] of agents.entries()) await insertAgent(agent, index !== 2);
  const policyUpdate = await admin
    .from('automation_policy_versions')
    .update({ configuration: safePolicy })
    .eq('id', active.data.id);
  if (policyUpdate.error) throw policyUpdate.error;

  const credentials = Object.fromEntries(
    agents.map((agent, index) => [
      agent.key,
      {
        current: { keyId, secret: agent.secret },
        ...(index === 0
          ? {
              previous: {
                keyId: 'packet14-previous',
                secret: agent.previousSecret,
                validUntil: new Date(Date.now() + 3600000).toISOString(),
              },
            }
          : {}),
      },
    ]),
  );
  web = launch(
    process.execPath,
    ['apps/web/node_modules/next/dist/bin/next', 'dev', 'apps/web', '-p', '3014'],
    { AUTOMATION_MACHINE_KEYS_JSON: JSON.stringify(credentials), PORT: '3014' },
  );
  await waitFor(controlPlane, [200, 307, 404]);

  const instanceA = randomUUID();
  const hello = await post(
    agents[0],
    '/api/internal/automation/v1/handshake',
    handshakeBody(instanceA),
  );
  assert(hello.status === 200, 'valid handshake failed');
  assert(
    JSON.stringify(hello.body.data.acceptedCapabilities) ===
      JSON.stringify({
        channels: ['INTERNAL'],
        actions: ['NOOP'],
        executionModes: ['DRY_RUN_ONLY'],
      }),
    'capability escalation was not intersected to the safe set',
  );
  const instanceB = randomUUID();
  assert(
    (await post(agents[1], '/api/internal/automation/v1/handshake', handshakeBody(instanceB)))
      .status === 200,
    'second agent handshake failed',
  );
  const unsupported = await post(agents[0], '/api/internal/automation/v1/handshake', {
    ...handshakeBody(instanceA),
    supportedProtocolVersions: [2],
  });
  assert(
    unsupported.status === 426 && unsupported.body.code === 'PROTOCOL_VERSION_UNSUPPORTED',
    'unsupported protocol was negotiated',
  );

  const badSecret = await post(
    agents[0],
    '/api/internal/automation/v1/claim',
    { operationId: randomUUID(), instanceId: instanceA, maxJobs: 1 },
    { secret: randomBytes(32).toString('base64url') },
  );
  assert(badSecret.status === 401, 'bad secret was accepted');
  const badKey = await post(
    agents[0],
    '/api/internal/automation/v1/claim',
    { operationId: randomUUID(), instanceId: instanceA, maxJobs: 1 },
    { keyId: 'unknown-key' },
  );
  assert(badKey.status === 401, 'unknown key id was accepted');
  const stale = await post(
    agents[0],
    '/api/internal/automation/v1/claim',
    { operationId: randomUUID(), instanceId: instanceA, maxJobs: 1 },
    { timestamp: Math.floor(Date.now() / 1000) - 301 },
  );
  assert(stale.status === 401, 'stale timestamp was accepted');
  const substituted = await post(
    agents[0],
    '/api/internal/automation/v1/heartbeat',
    {
      operationId: randomUUID(),
      instanceId: instanceA,
      bridgeVersion: '14.0.0-test',
      protocolVersion: 1,
      uptimeSeconds: 1,
      executorMode: 'DRY_RUN_ONLY',
      capabilities: { channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] },
      activeJobs: 0,
      runtimeState: {},
    },
    { signPath: '/api/internal/automation/v1/claim' },
  );
  assert(substituted.status === 401, 'path substitution was accepted');
  const tamperPath = '/api/internal/automation/v1/claim';
  const tampered = signed(agents[0], tamperPath, {
    operationId: randomUUID(),
    instanceId: instanceA,
    maxJobs: 1,
  });
  const tamperResponse = await fetch(controlPlane + tamperPath, {
    method: 'POST',
    headers: tampered.headers,
    body: tampered.body.replace('"maxJobs":1', '"maxJobs":2'),
  });
  assert(tamperResponse.status === 401, 'body tampering was accepted');
  const disabled = await post(
    agents[2],
    '/api/internal/automation/v1/handshake',
    handshakeBody(randomUUID()),
  );
  assert(disabled.status === 403, 'disabled agent was accepted');
  const oversized = await post(agents[0], '/api/internal/automation/v1/claim', null, {
    body: JSON.stringify({ value: 'x'.repeat(65536) }),
  });
  assert(oversized.status === 413, 'oversized body was accepted');
  const query = await post(
    agents[0],
    '/api/internal/automation/v1/claim',
    { operationId: randomUUID(), instanceId: instanceA, maxJobs: 1 },
    { query: '?unexpected=1' },
  );
  assert(query.status === 400, 'query string was accepted');
  const rotated = await post(
    agents[0],
    '/api/internal/automation/v1/heartbeat',
    {
      operationId: randomUUID(),
      instanceId: instanceA,
      bridgeVersion: '14.0.0-test',
      protocolVersion: 1,
      uptimeSeconds: 1,
      executorMode: 'DRY_RUN_ONLY',
      capabilities: { channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] },
      activeJobs: 0,
      runtimeState: { rotation: true },
    },
    { keyId: 'packet14-previous', secret: agents[0].previousSecret },
  );
  assert(rotated.status === 200, 'bounded previous credential was rejected during rotation');

  const nonce = randomUUID();
  const heartbeat = {
    operationId: randomUUID(),
    instanceId: instanceA,
    bridgeVersion: '14.0.0-test',
    protocolVersion: 1,
    uptimeSeconds: 1,
    executorMode: 'DRY_RUN_ONLY',
    capabilities: { channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] },
    activeJobs: 0,
    runtimeState: { test: true },
  };
  const replay = await Promise.all([
    post(agents[0], '/api/internal/automation/v1/heartbeat', heartbeat, { nonce }),
    post(agents[0], '/api/internal/automation/v1/heartbeat', heartbeat, { nonce }),
  ]);
  assert(
    replay.filter((x) => x.status === 200).length === 1 &&
      replay.filter((x) => x.status === 401).length === 1,
    'concurrent nonce replay was not single-winner',
  );
  const verificationStarted = performance.now();
  for (let index = 0; index < 10; index += 1) {
    const measured = await post(agents[0], '/api/internal/automation/v1/heartbeat', {
      ...heartbeat,
      operationId: randomUUID(),
      uptimeSeconds: index + 2,
    });
    assert(measured.status === 200, 'measured signed heartbeat failed');
  }
  const averageVerificationMs = (performance.now() - verificationStarted) / 10;

  const jobId = await insertJob('signed-lifecycle');
  const claimOperation = randomUUID();
  const claimPayload = { operationId: claimOperation, instanceId: instanceA, maxJobs: 1 };
  const claimStarted = performance.now();
  const claim = await post(agents[0], '/api/internal/automation/v1/claim', claimPayload);
  const claimMs = performance.now() - claimStarted;
  assert(claim.status === 200 && claim.body.data.status === 'CLAIMED', 'job was not claimed');
  const claimRetry = await post(agents[0], '/api/internal/automation/v1/claim', claimPayload);
  assert(claimRetry.body.data.job.jobId === jobId, 'claim retry changed outcome');
  const sameAgent = await post(agents[0], '/api/internal/automation/v1/claim', {
    operationId: randomUUID(),
    instanceId: instanceA,
    maxJobs: 1,
  });
  assert(sameAgent.body.data.status === 'NO_JOB', 'same agent exceeded max concurrency one');
  const conflict = await post(agents[0], '/api/internal/automation/v1/claim', {
    ...claimPayload,
    instanceId: randomUUID(),
  });
  assert(
    conflict.status === 409 && conflict.body.code === 'IDEMPOTENCY_CONFLICT',
    'changed idempotent request did not conflict',
  );
  let job = claim.body.data.job;
  const leasePayload = {
    operationId: randomUUID(),
    instanceId: instanceA,
    expectedJobVersion: job.jobVersion,
    expectedLeaseExpiresAt: job.leaseExpiresAt,
  };
  const lease = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/lease`,
    leasePayload,
  );
  assert(
    lease.status === 200 && lease.body.data.status === 'LEASE_EXTENDED',
    'lease extension failed: ' + JSON.stringify({ lease, leasePayload, job }),
  );
  const leaseRetry = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/lease`,
    leasePayload,
  );
  assert(
    leaseRetry.body.data.jobVersion === lease.body.data.jobVersion,
    'lease retry was not stable',
  );
  job = {
    ...job,
    jobVersion: lease.body.data.jobVersion,
    leaseExpiresAt: lease.body.data.leaseExpiresAt,
  };
  const startPayload = {
    operationId: randomUUID(),
    instanceId: instanceA,
    expectedJobVersion: job.jobVersion,
    contentHash: job.contentHash,
    policyVersion: job.policyVersion,
    expectedLeaseExpiresAt: job.leaseExpiresAt,
  };
  const start = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/start`,
    startPayload,
  );
  assert(start.status === 200 && start.body.data.status === 'RUNNING', 'start failed');
  const startRetry = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/start`,
    startPayload,
  );
  assert(
    startRetry.body.data.jobVersion === start.body.data.jobVersion,
    'start retry was not stable',
  );
  const resultPayload = {
    operationId: randomUUID(),
    instanceId: instanceA,
    expectedJobVersion: start.body.data.jobVersion,
    resultType: 'SUCCESS',
    dryRun: true,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    evidence: { executor: 'PACKET14_TEST', dryRun: true },
  };
  const wrongAgent = await post(agents[1], `/api/internal/automation/v1/jobs/${jobId}/result`, {
    ...resultPayload,
    operationId: randomUUID(),
    instanceId: instanceB,
  });
  assert(wrongAgent.status === 409, 'wrong agent completed another agent job');
  const result = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/result`,
    resultPayload,
  );
  assert(result.status === 200 && result.body.data.status === 'COMPLETED', 'success result failed');
  const resultRetry = await post(
    agents[0],
    `/api/internal/automation/v1/jobs/${jobId}/result`,
    resultPayload,
  );
  assert(
    resultRetry.body.data.jobVersion === result.body.data.jobVersion,
    'result retry was not stable',
  );
  const late = await post(agents[0], `/api/internal/automation/v1/jobs/${jobId}/result`, {
    ...resultPayload,
    operationId: randomUUID(),
  });
  assert(late.status === 409, 'late result was accepted');
  const actions = await admin
    .from('automation_actions')
    .select('id', { count: 'exact', head: true })
    .eq('automation_job_id', jobId);
  assert(actions.count === 1, 'result retry duplicated execution evidence');

  const policyMatrixJobIds = [];
  const signedStart = (fixture, overrides = {}) =>
    post(agents[0], `/api/internal/automation/v1/jobs/${fixture.jobId}/start`, {
      operationId: randomUUID(),
      instanceId: instanceA,
      expectedJobVersion: fixture.jobVersion,
      contentHash: overrides.contentHash ?? fixture.contentHash,
      policyVersion: fixture.policyVersion,
      expectedLeaseExpiresAt: fixture.leaseExpiresAt,
    });
  const failureCode = async (fixture) => {
    const state = await admin
      .from('automation_jobs')
      .select('status,failure_code')
      .eq('id', fixture.jobId)
      .single();
    if (state.error) throw state.error;
    return state.data;
  };

  const dncFixture = await insertClaimedPolicyJob('dnc-after-claim', agents[0], instanceA);
  policyMatrixJobIds.push(dncFixture.jobId);
  await admin.from('people').update({ do_not_contact: true }).eq('id', dncFixture.personId);
  const dncStart = await signedStart(dncFixture);
  assert(
    dncStart.status === 200 &&
      dncStart.body.data.status === 'BLOCKED' &&
      (await failureCode(dncFixture)).failure_code === 'DNC_BLOCKED',
    'DNC after claim did not block signed start',
  );

  const consentFixture = await insertClaimedPolicyJob('consent-after-claim', agents[0], instanceA);
  policyMatrixJobIds.push(consentFixture.jobId);
  const withdrawnAt = new Date().toISOString();
  const withdrawn = await admin.from('consents').insert({
    person_id: consentFixture.personId,
    marketing_email: false,
    captured_at: withdrawnAt,
    withdrawn_at: withdrawnAt,
    policy_version: 'packet14-withdrawn',
    source: 'PACKET14_RUNTIME',
  });
  if (withdrawn.error) throw withdrawn.error;
  const consentStart = await signedStart(consentFixture);
  assert(
    consentStart.status === 200 &&
      consentStart.body.data.status === 'BLOCKED' &&
      (await failureCode(consentFixture)).failure_code === 'CONSENT_WITHDRAWN',
    'consent withdrawal after claim did not block signed start',
  );

  const expiredFixture = await insertClaimedPolicyJob(
    'approval-expired',
    agents[0],
    instanceA,
    'MARKETING',
    new Date(Date.now() - 1000).toISOString(),
  );
  policyMatrixJobIds.push(expiredFixture.jobId);
  const expiredStart = await signedStart(expiredFixture);
  assert(
    expiredStart.status === 200 &&
      expiredStart.body.data.status === 'BLOCKED' &&
      (await failureCode(expiredFixture)).failure_code === 'APPROVAL_EXPIRED',
    'expired approval did not block signed start',
  );

  const contentFixture = await insertClaimedPolicyJob('content-change', agents[0], instanceA);
  policyMatrixJobIds.push(contentFixture.jobId);
  const contentStart = await signedStart(contentFixture, { contentHash: '0'.repeat(64) });
  assert(
    contentStart.status === 409 && contentStart.body.code === 'JOB_STATE_CONFLICT',
    'content hash mismatch was accepted by signed start',
  );
  await admin
    .from('automation_jobs')
    .update({ status: 'CANCELLED', claimed_by: null, claimed_at: null, lease_expires_at: null })
    .eq('id', contentFixture.jobId);

  const mergeFixture = await insertClaimedPolicyJob('merge-after-claim', agents[0], instanceA);
  policyMatrixJobIds.push(mergeFixture.jobId);
  const mergeTarget = await admin
    .from('people')
    .insert({
      display_name: 'Packet 14 merge target',
      primary_email: `packet14-merge-target-${suffix}-${randomUUID()}@example.test`,
    })
    .select('id')
    .single();
  if (mergeTarget.error) throw mergeTarget.error;
  const merged = await admin
    .from('people')
    .update({ merged_into_person_id: mergeTarget.data.id })
    .eq('id', mergeFixture.personId);
  if (merged.error) throw merged.error;
  const mergeStart = await signedStart(mergeFixture);
  assert(
    mergeStart.status === 409 && (await failureCode(mergeFixture)).failure_code === 'PERSON_MERGED',
    'person merge after claim did not block signed start',
  );

  const opportunityFixture = await insertClaimedPolicyJob(
    'opportunity-closed',
    agents[0],
    instanceA,
    'SALES_FOLLOW_UP',
  );
  policyMatrixJobIds.push(opportunityFixture.jobId);
  const closedStage = await admin
    .from('pipeline_stages')
    .select('id')
    .eq('is_closed', true)
    .order('sort_order')
    .limit(1)
    .single();
  if (closedStage.error) throw closedStage.error;
  const closed = await admin
    .from('opportunities')
    .update({ stage_id: closedStage.data.id })
    .eq('id', opportunityFixture.opportunityId);
  if (closed.error) throw closed.error;
  const opportunityStart = await signedStart(opportunityFixture);
  assert(
    opportunityStart.status === 200 &&
      opportunityStart.body.data.status === 'BLOCKED' &&
      (await failureCode(opportunityFixture)).failure_code === 'OPPORTUNITY_CLOSED',
    'closed opportunity after claim did not block signed start',
  );

  const policyFixture = await insertClaimedPolicyJob('policy-change', agents[0], instanceA);
  policyMatrixJobIds.push(policyFixture.jobId);
  const currentPolicy = await admin
    .from('automation_policy_versions')
    .select('id,version,configuration,configuration_hash')
    .eq('active', true)
    .single();
  if (currentPolicy.error) throw currentPolicy.error;
  const latestPolicy = await admin
    .from('automation_policy_versions')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();
  if (latestPolicy.error) throw latestPolicy.error;
  await admin
    .from('automation_policy_versions')
    .update({ active: false })
    .eq('id', currentPolicy.data.id);
  const changedPolicy = await admin
    .from('automation_policy_versions')
    .insert({
      version: latestPolicy.data.version + 1,
      name: 'Packet 14 changed after claim',
      configuration: currentPolicy.data.configuration,
      configuration_hash: currentPolicy.data.configuration_hash,
      active: true,
      activated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (changedPolicy.error) throw changedPolicy.error;
  const policyStart = await signedStart(policyFixture);
  assert(
    policyStart.status === 409 && policyStart.body.code === 'JOB_STATE_CONFLICT',
    'policy change after claim was accepted by signed start',
  );
  await admin
    .from('automation_policy_versions')
    .update({ active: false })
    .eq('id', changedPolicy.data.id);
  await admin
    .from('automation_policy_versions')
    .update({ active: true })
    .eq('id', currentPolicy.data.id);
  await admin
    .from('automation_jobs')
    .update({ status: 'CANCELLED', claimed_by: null, claimed_at: null, lease_expires_at: null })
    .eq('id', policyFixture.jobId);
  const policyActions = await admin
    .from('automation_actions')
    .select('id,automation_job_id,status')
    .in('automation_job_id', policyMatrixJobIds);
  if (policyActions.error) throw policyActions.error;
  assert(
    policyActions.data.length === 0,
    'policy recheck matrix produced an external side effect: ' + JSON.stringify(policyActions.data),
  );

  const concurrentIds = await Promise.all([insertJob('two-agent-a'), insertJob('two-agent-b')]);
  const heartbeatB = await post(agents[1], '/api/internal/automation/v1/heartbeat', {
    ...heartbeat,
    operationId: randomUUID(),
    instanceId: instanceB,
  });
  assert(heartbeatB.status === 200, 'second agent heartbeat failed');
  const twoAgentClaims = await Promise.all([
    post(agents[0], '/api/internal/automation/v1/claim', {
      operationId: randomUUID(),
      instanceId: instanceA,
      maxJobs: 1,
    }),
    post(agents[1], '/api/internal/automation/v1/claim', {
      operationId: randomUUID(),
      instanceId: instanceB,
      maxJobs: 1,
    }),
  ]);
  const claimedIds = twoAgentClaims.map((value) => value.body.data?.job?.jobId).filter(Boolean);
  assert(
    claimedIds.length === 2 && new Set(claimedIds).size === 2,
    'two agents did not claim distinct jobs concurrently',
  );
  const release = await admin
    .from('automation_jobs')
    .update({
      status: 'CANCELLED',
      claimed_by: null,
      claimed_at: null,
      lease_expires_at: null,
      machine_instance_id: null,
    })
    .in('id', concurrentIds);
  if (release.error) throw release.error;

  const compiledJob = await insertJob('compiled-process');
  const transientJob = await insertJob('compiled-transient', 'TRANSIENT_FAILURE');
  const manualJob = await insertJob('compiled-manual', 'SECURITY_CHECKPOINT');
  const unknownJob = await insertJob('compiled-unknown', 'UNKNOWN_OUTCOME');
  bridge = launchModule('services/meta-bridge/dist/index.js', {
    NODE_ENV: 'test',
    ZAVLIO_CONTROL_PLANE_URL: controlPlane,
    ZAVLIO_AGENT_KEY: agents[1].key,
    ZAVLIO_MACHINE_KEY_ID: keyId,
    ZAVLIO_MACHINE_HMAC_SECRET: agents[1].secret,
    ZAVLIO_BRIDGE_VERSION: '14.0.0-compiled-test',
    ZAVLIO_PROTOCOL_VERSION: '1',
    ZAVLIO_EXECUTOR_MODE: 'DRY_RUN_ONLY',
    ZAVLIO_HEARTBEAT_INTERVAL_MS: '5000',
    ZAVLIO_POLL_INTERVAL_MS: '1000',
    ZAVLIO_REQUEST_TIMEOUT_MS: '5000',
    ZAVLIO_MAX_CONCURRENCY: '1',
    META_BRIDGE_HOST: '127.0.0.1',
    META_BRIDGE_PORT: '4014',
    SUPABASE_SERVICE_ROLE_KEY: '',
  });
  await waitFor('http://127.0.0.1:4014/ready', [200]);
  const end = Date.now() + 30000;
  let completed = false,
    classified = false;
  while (Date.now() < end) {
    const states = await admin
      .from('automation_jobs')
      .select('id,status,failure_code')
      .in('id', [compiledJob, transientJob, manualJob, unknownJob]);
    if (states.error) throw states.error;
    const byId = new Map(states.data.map((row) => [row.id, row]));
    completed = byId.get(compiledJob)?.status === 'COMPLETED';
    classified =
      byId.get(transientJob)?.status === 'QUEUED' &&
      byId.get(transientJob)?.failure_code === 'TRANSIENT_NETWORK' &&
      byId.get(manualJob)?.status === 'MANUAL_ACTION_REQUIRED' &&
      byId.get(manualJob)?.failure_code === 'SECURITY_CHECKPOINT' &&
      byId.get(unknownJob)?.status === 'MANUAL_ACTION_REQUIRED' &&
      byId.get(unknownJob)?.failure_code === 'EXECUTION_OUTCOME_UNKNOWN';
    if (completed && classified) break;
    await delay(400);
  }
  assert(completed, 'compiled bridge did not complete the safe job');
  assert(classified, 'compiled bridge did not preserve transient/manual/unknown outcomes');
  bridge.send({ type: 'shutdown' });
  await Promise.race([
    new Promise((resolve) => bridge.once('exit', resolve)),
    delay(5000).then(() => bridge.kill('SIGKILL')),
  ]);
  bridge = undefined;
  assert(
    childLogs.join('').includes('BRIDGE_STOPPED'),
    'compiled bridge did not shut down gracefully',
  );
  assert(!childLogs.join('').includes(agents[1].secret), 'bridge logs exposed its HMAC secret');

  process.stdout.write(
    JSON.stringify(
      {
        packet: 14,
        status: 'PASS',
        signedLifecycleJob: jobId,
        compiledBridgeJob: compiledJob,
        checks,
        hostileCases: 11,
        replaySingleWinner: true,
        duplicateActions: actions.count,
        sameAgentConcurrency: 1,
        twoAgentDistinctClaims: claimedIds.length,
        averageSignedHeartbeatMs: Number(averageVerificationMs.toFixed(2)),
        claimMs: Number(claimMs.toFixed(2)),
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await stop(bridge);
  await stop(web);
  await admin
    .from('automation_policy_versions')
    .update({
      configuration: active.data.configuration,
      configuration_hash: active.data.configuration_hash,
    })
    .eq('id', active.data.id);
}
