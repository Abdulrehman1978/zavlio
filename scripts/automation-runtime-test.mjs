import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service = process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret = process.env.SUPABASE_JWT_SECRET;
if (!url || !anon || !service || !secret)
  throw new Error('Packet 13 runtime requires local Supabase credentials.');
const admin = createClient(url, service, { auth: { persistSession: false } }),
  suffix = Date.now().toString(36),
  users = new Map(),
  created = { users: [], people: [], agents: [] };
const assert = (v, m) => {
  if (!v) throw new Error(m);
};
const token = (id) => {
  const e = (v) => Buffer.from(JSON.stringify(v)).toString('base64url'),
    now = Math.floor(Date.now() / 1000),
    h = e({ alg: 'HS256', typ: 'JWT' }),
    p = e({
      aud: 'authenticated',
      role: 'authenticated',
      sub: id,
      iss: url + '/auth/v1',
      iat: now,
      exp: now + 3600,
    }),
    x = h + '.' + p;
  return x + '.' + createHmac('sha256', secret).update(x).digest('base64url');
};
async function staff(role) {
  const email = 'packet13-' + role.toLowerCase() + '-' + suffix + '@example.test',
    u = await admin.auth.admin.createUser({
      email,
      password: 'Packet13-Local-Password-123!',
      email_confirm: true,
    });
  if (u.error) throw u.error;
  created.users.push(u.data.user.id);
  const p = await admin
    .from('staff_profiles')
    .insert({ auth_user_id: u.data.user.id, email, name: 'Packet 13 ' + role, role, active: true })
    .select('id')
    .single();
  if (p.error) throw p.error;
  users.set(role, { id: p.data.id, token: token(u.data.user.id) });
}
async function rpc(role, name, args) {
  const r = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: 'Bearer ' + users.get(role)?.token,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(args),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const config = {
  enabled: true,
  dryRun: true,
  approvalRequired: true,
  allowedChannels: ['EMAIL', 'INSTAGRAM', 'INTERNAL'],
  allowedActions: ['SEND_EMAIL', 'DM', 'REPLY', 'CREATE_TASK', 'NOOP'],
  allowedPurposes: ['MARKETING', 'SALES_FOLLOW_UP', 'INBOUND_REPLY', 'TRANSACTIONAL', 'INTERNAL'],
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
  retryBackoffSeconds: [1, 2, 3],
};
async function person(label, { dnc = false, consent = true } = {}) {
  const p = await admin
    .from('people')
    .insert({
      display_name: 'Packet 13 ' + label,
      primary_email: 'packet13-' + label.toLowerCase() + '-' + suffix + '@example.test',
      do_not_contact: dnc,
    })
    .select('id')
    .single();
  if (p.error) throw p.error;
  created.people.push(p.data.id);
  if (consent) {
    const c = await admin.from('consents').insert({
      person_id: p.data.id,
      marketing_email: true,
      marketing_social: true,
      policy_version: 'packet13-test',
      source: 'RUNTIME_FIXTURE',
    });
    if (c.error) throw c.error;
  }
  return p.data.id;
}
async function propose(
  personId,
  key = randomUUID(),
  action = 'SEND_EMAIL',
  purpose = 'MARKETING',
  channel = 'EMAIL',
) {
  return rpc('OPERATOR', 'propose_automation_job', {
    p_person_id: personId,
    p_opportunity_id: null,
    p_channel: channel,
    p_action: action,
    p_purpose: purpose,
    p_payload: { schemaVersion: 1, text: 'Approved dry-run fixture' },
    p_idempotency_key: key,
    p_source_reference: 'runtime',
    p_scheduled_for: new Date(Date.now() - 1000).toISOString(),
    p_priority: 0,
  });
}
async function approve(job) {
  return rpc('ADMIN', 'approve_automation_job', {
    p_job_id: job.id,
    p_expected_version: job.version,
  });
}
try {
  for (const r of ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']) await staff(r);
  const denied = await rpc('ADMIN', 'activate_automation_policy', {
    p_configuration: config,
    p_name: 'Denied admin',
  });
  assert(denied.status === 403, 'ADMIN activated owner-only policy');
  const active = await rpc('OWNER', 'activate_automation_policy', {
    p_configuration: config,
    p_name: 'Packet 13 runtime',
  });
  assert(active.status === 200, 'OWNER could not activate safe dry-run policy');
  const eligiblePerson = await person('Eligible'),
    dncPerson = await person('Dnc', { dnc: true }),
    missingPerson = await person('Missing', { consent: false });
  const viewer = await rpc('VIEWER', 'propose_automation_job', {
    p_person_id: eligiblePerson,
    p_opportunity_id: null,
    p_channel: 'EMAIL',
    p_action: 'SEND_EMAIL',
    p_purpose: 'MARKETING',
    p_payload: { schemaVersion: 1, text: 'x' },
    p_idempotency_key: randomUUID(),
    p_source_reference: 'runtime',
    p_scheduled_for: new Date().toISOString(),
    p_priority: 0,
  });
  assert(viewer.status === 403, 'VIEWER proposed a job');
  const good = await propose(eligiblePerson);
  assert(
    good.status === 200 && good.body[0].status === 'AWAITING_APPROVAL',
    'eligible proposal did not await approval',
  );
  const dnc = await propose(dncPerson);
  assert(
    dnc.body[0].status === 'BLOCKED' && dnc.body[0].failure_code === 'DNC_BLOCKED',
    'DNC did not hard block',
  );
  const missing = await propose(missingPerson);
  assert(
    missing.body[0].status === 'BLOCKED' && missing.body[0].failure_code === 'CONSENT_MISSING',
    'missing consent did not block',
  );
  const dncApprove = await rpc('ADMIN', 'approve_automation_job', {
    p_job_id: dnc.body[0].id,
    p_expected_version: dnc.body[0].version,
  });
  assert(dncApprove.status >= 400, 'approval bypassed DNC');
  const key = 'same-' + randomUUID(),
    [id1, id2] = await Promise.all([
      propose(eligiblePerson, key, 'REPLY', 'INBOUND_REPLY'),
      propose(eligiblePerson, key, 'REPLY', 'INBOUND_REPLY'),
    ]);
  assert(id1.body[0].id === id2.body[0].id, 'concurrent idempotency created duplicates');
  const semantic = await propose(eligiblePerson, randomUUID(), 'REPLY', 'INBOUND_REPLY');
  assert(
    semantic.body[0].status === 'BLOCKED' && semantic.body[0].failure_code === 'DUPLICATE_JOB',
    'semantic duplicate was not suppressed',
  );
  const racePerson = await person('Race'),
    race = await propose(racePerson);
  const [yes, no] = await Promise.all([
    approve(race.body[0]),
    rpc('ADMIN', 'reject_automation_job', {
      p_job_id: race.body[0].id,
      p_expected_version: race.body[0].version,
      p_reason: 'Concurrent rejection',
    }),
  ]);
  assert(
    [yes.status, no.status].filter((x) => x === 200).length === 1,
    'approval concurrency was not single-winner',
  );
  const approved = await approve(good.body[0]);
  assert(
    approved.status === 200 && approved.body[0].status === 'QUEUED',
    'approval did not queue job',
  );
  await admin.from('people').update({ do_not_contact: true }).eq('id', eligiblePerson);
  const decision = await admin.rpc('automation_check_job', {
    p_job_id: approved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date().toISOString(),
  });
  if (decision.error) throw decision.error;
  const drow = await admin
    .from('automation_policy_decisions')
    .select('decision,reason_codes')
    .eq('id', decision.data)
    .single();
  assert(
    drow.data.decision === 'BLOCK' && drow.data.reason_codes.includes('DNC_BLOCKED'),
    'DNC after approval was not revalidated',
  );
  await admin.from('people').update({ do_not_contact: false }).eq('id', eligiblePerson);
  const contentPerson = await person('Content'),
    content = await propose(contentPerson),
    contentApproved = await approve(content.body[0]);
  await admin
    .from('automation_jobs')
    .update({ payload: { schemaVersion: 1, text: 'Changed after approval' } })
    .eq('id', contentApproved.body[0].id);
  const cd = await admin.rpc('automation_check_job', {
    p_job_id: contentApproved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date().toISOString(),
  });
  const cdr = await admin
    .from('automation_policy_decisions')
    .select('reason_codes')
    .eq('id', cd.data)
    .single();
  assert(
    cdr.data.reason_codes.includes('APPROVAL_INVALIDATED'),
    'changed content retained approval',
  );
  const withdrawPerson = await person('Withdraw'),
    withdraw = await propose(withdrawPerson),
    withdrawApproved = await approve(withdraw.body[0]);
  const capturedAt = new Date(),
    withdrawInsert = await admin.from('consents').insert({
      person_id: withdrawPerson,
      marketing_email: false,
      marketing_social: false,
      captured_at: capturedAt.toISOString(),
      withdrawn_at: new Date(capturedAt.getTime() + 1000).toISOString(),
      policy_version: 'packet13-test',
      source: 'WITHDRAWAL',
    });
  if (withdrawInsert.error) throw withdrawInsert.error;
  const wd = await admin.rpc('automation_check_job', {
    p_job_id: withdrawApproved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date().toISOString(),
  });
  const wdr = await admin
    .from('automation_policy_decisions')
    .select('reason_codes')
    .eq('id', wd.data)
    .single();
  assert(
    wdr.data.reason_codes.includes('CONSENT_WITHDRAWN'),
    'withdrawn consent retained approval',
  );
  const offline = await admin
    .from('automation_agents')
    .insert({
      agent_key: 'packet13-offline-' + suffix,
      name: 'Packet 13 Offline Agent',
      enabled: false,
      status: 'OFFLINE',
    })
    .select('id')
    .single();
  const offlineClaim = await admin.rpc('claim_next_automation_job', {
    p_agent_id: offline.data.id,
    p_lease_seconds: 60,
  });
  assert(offlineClaim.error, 'disabled agent was allowed to claim');
  const agent = await admin
    .from('automation_agents')
    .insert({
      agent_key: 'packet13-' + suffix,
      name: 'Packet 13 Test Agent',
      enabled: true,
      status: 'ONLINE',
      last_heartbeat_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (agent.error) throw agent.error;
  created.agents.push(agent.data.id);
  const cancelPerson = await person('CancelRace'),
    cancelJob = await propose(cancelPerson),
    cancelApproved = await approve(cancelJob.body[0]);
  await admin
    .from('automation_jobs')
    .update({ status: 'BLOCKED', failure_code: 'RUNTIME_ISOLATION' })
    .neq('id', cancelApproved.body[0].id)
    .in('status', ['QUEUED', 'CLAIMED']);
  const [raceClaim, raceCancel] = await Promise.all([
    admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 }),
    rpc('ADMIN', 'cancel_automation_job', {
      p_job_id: cancelApproved.body[0].id,
      p_expected_version: cancelApproved.body[0].version,
      p_reason: 'Concurrent cancellation test',
    }),
  ]);
  const raceFinal = await admin
    .from('automation_jobs')
    .select('status')
    .eq('id', cancelApproved.body[0].id)
    .single();
  assert(
    ['CLAIMED', 'CANCELLED'].includes(raceFinal.data.status) &&
      !(raceClaim.data?.length && raceCancel.status === 200),
    'claim/cancel race produced contradictory success',
  );
  await admin
    .from('automation_jobs')
    .update({
      status: 'BLOCKED',
      claimed_by: null,
      claimed_at: null,
      lease_expires_at: null,
      failure_code: 'RUNTIME_ISOLATION',
    })
    .eq('id', cancelApproved.body[0].id);
  const runPerson = await person('Run'),
    run = await propose(runPerson),
    runApproved = await approve(run.body[0]);
  await admin
    .from('automation_jobs')
    .update({ status: 'BLOCKED', failure_code: 'RUNTIME_ISOLATION' })
    .neq('id', runApproved.body[0].id)
    .in('status', ['QUEUED', 'CLAIMED']);
  const [claimA, claimB] = await Promise.all([
    admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 }),
    admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 }),
  ]);
  const claims = [...(claimA.data ?? []), ...(claimB.data ?? [])].filter(
    (x) => x.id === runApproved.body[0].id,
  );
  assert(claims.length === 1, 'job was claimed more than once');
  const started = await admin.rpc('start_automation_job', {
    p_job_id: runApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  if (started.error) throw started.error;
  const complete = await admin.rpc('complete_automation_job', {
    p_job_id: runApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_evidence: { executor: 'PACKET13_TEST' },
  });
  assert(
    complete.data[0].status === 'COMPLETED' && complete.data[0].dry_run,
    'dry-run did not complete safely',
  );
  const action = await admin
    .from('automation_actions')
    .select('dry_run,evidence')
    .eq('automation_job_id', runApproved.body[0].id)
    .single();
  assert(action.data.dry_run && action.data.evidence.dryRun === true, 'dry-run evidence missing');
  const manualPerson = await person('Manual'),
    manual = await propose(manualPerson),
    manualApproved = await approve(manual.body[0]);
  const claimed = await admin.rpc('claim_next_automation_job', {
    p_agent_id: agent.data.id,
    p_lease_seconds: 60,
  });
  assert(claimed.data[0].id === manualApproved.body[0].id, 'manual test job was not claimed');
  await admin.rpc('start_automation_job', {
    p_job_id: manualApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  const manualResult = await admin.rpc('fail_automation_job', {
    p_job_id: manualApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_code: 'SECURITY_CHECKPOINT',
    p_summary: 'Synthetic checkpoint',
    p_retry_at: null,
  });
  assert(
    manualResult.data[0].status === 'MANUAL_ACTION_REQUIRED',
    'checkpoint did not stop for human',
  );
  const unknownPerson = await person('Unknown'),
    unknown = await propose(unknownPerson),
    unknownApproved = await approve(unknown.body[0]);
  await admin.rpc('claim_next_automation_job', {
    p_agent_id: agent.data.id,
    p_lease_seconds: 60,
  });
  await admin.rpc('start_automation_job', {
    p_job_id: unknownApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  const ur = await admin.rpc('fail_automation_job', {
    p_job_id: unknownApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_code: 'EXECUTION_OUTCOME_UNKNOWN',
    p_summary: 'Synthetic ambiguity',
    p_retry_at: null,
  });
  assert(ur.data[0].status === 'MANUAL_ACTION_REQUIRED', 'unknown outcome auto-retried');
  const expiryPerson = await person('Expiry'),
    expiry = await propose(expiryPerson),
    expiryApproved = await approve(expiry.body[0]);
  const expiryDecision = await admin.rpc('automation_check_job', {
    p_job_id: expiryApproved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date(Date.now() + 7200000).toISOString(),
  });
  const expiryRow = await admin
    .from('automation_policy_decisions')
    .select('reason_codes')
    .eq('id', expiryDecision.data)
    .single();
  assert(
    expiryRow.data.reason_codes.includes('APPROVAL_EXPIRED'),
    'expired approval remained executable',
  );
  const policyPerson = await person('Policy'),
    policyJob = await propose(policyPerson),
    policyApproved = await approve(policyJob.body[0]);
  const policyV2 = { ...config, allowedActions: ['DM', 'REPLY', 'CREATE_TASK', 'NOOP'] };
  const changedPolicy = await rpc('OWNER', 'activate_automation_policy', {
    p_configuration: policyV2,
    p_name: 'Policy action disabled',
  });
  assert(changedPolicy.status === 200, 'policy change failed');
  const policyDecision = await admin.rpc('automation_check_job', {
    p_job_id: policyApproved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date().toISOString(),
  });
  const policyRow = await admin
    .from('automation_policy_decisions')
    .select('reason_codes')
    .eq('id', policyDecision.data)
    .single();
  assert(
    policyRow.data.reason_codes.includes('ACTION_DISABLED') &&
      policyRow.data.reason_codes.includes('POLICY_CHANGED'),
    'policy change did not invalidate approval',
  );
  await rpc('OWNER', 'activate_automation_policy', {
    p_configuration: config,
    p_name: 'Runtime restored',
  });
  const stages = await admin.from('pipeline_stages').select('id,slug'),
    open = stages.data.find((x) => x.slug === 'new').id,
    lost = stages.data.find((x) => x.slug === 'lost').id,
    closedPerson = await person('Closed');
  const opportunity = await admin
    .from('opportunities')
    .insert({ person_id: closedPerson, title: 'Packet 13 close test', stage_id: open })
    .select('id')
    .single();
  const closedJob = await rpc('OPERATOR', 'propose_automation_job', {
    p_person_id: closedPerson,
    p_opportunity_id: opportunity.data.id,
    p_channel: 'EMAIL',
    p_action: 'SEND_EMAIL',
    p_purpose: 'SALES_FOLLOW_UP',
    p_payload: { schemaVersion: 1, text: 'Follow-up' },
    p_idempotency_key: randomUUID(),
    p_source_reference: 'runtime',
    p_scheduled_for: new Date().toISOString(),
    p_priority: 0,
  });
  const closedApproved = await approve(closedJob.body[0]);
  await admin.from('opportunities').update({ stage_id: lost }).eq('id', opportunity.data.id);
  const closedDecision = await admin.rpc('automation_check_job', {
    p_job_id: closedApproved.body[0].id,
    p_phase: 'EXECUTION',
    p_as_of: new Date().toISOString(),
  });
  const closedRow = await admin
    .from('automation_policy_decisions')
    .select('reason_codes')
    .eq('id', closedDecision.data)
    .single();
  assert(
    closedRow.data.reason_codes.includes('OPPORTUNITY_CLOSED'),
    'closed opportunity remained eligible',
  );
  const mergeSource = await person('MergeSource'),
    mergeTarget = await person('MergeTarget'),
    mergeJob = await propose(mergeSource);
  const merge = await rpc('ADMIN', 'merge_people', {
    p_source_person_id: mergeSource,
    p_target_person_id: mergeTarget,
    p_candidate_id: null,
    p_reason: 'Packet 13 runtime merge',
  });
  assert(merge.status === 200, 'merge fixture failed');
  const mergedJob = await admin
    .from('automation_jobs')
    .select('status,failure_code,person_id')
    .eq('id', mergeJob.body[0].id)
    .single();
  assert(
    mergedJob.data.status === 'BLOCKED' &&
      mergedJob.data.failure_code === 'PERSON_MERGED' &&
      mergedJob.data.person_id === mergeTarget,
    'merged source job was silently rebound',
  );
  await admin
    .from('automation_jobs')
    .update({ status: 'BLOCKED', failure_code: 'RUNTIME_ISOLATION' })
    .in('status', ['QUEUED', 'CLAIMED']);
  const leasePerson = await person('Lease'),
    lease = await propose(leasePerson),
    leaseApproved = await approve(lease.body[0]);
  const leaseClaim = await admin.rpc('claim_next_automation_job', {
    p_agent_id: agent.data.id,
    p_lease_seconds: 60,
  });
  assert(leaseClaim.data[0].id === leaseApproved.body[0].id, 'lease fixture claim failed');
  await admin
    .from('automation_jobs')
    .update({ lease_expires_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', leaseApproved.body[0].id);
  const recovered = await admin.rpc('recover_expired_automation_jobs', {
    p_as_of: new Date().toISOString(),
  });
  const leaseRow = await admin
    .from('automation_jobs')
    .select('status,failure_code')
    .eq('id', leaseApproved.body[0].id)
    .single();
  assert(
    recovered.data === 1 &&
      leaseRow.data.status === 'QUEUED' &&
      leaseRow.data.failure_code === 'LEASE_EXPIRED',
    'expired lease did not recover',
  );
  await admin
    .from('automation_jobs')
    .update({ status: 'BLOCKED', failure_code: 'RUNTIME_ISOLATION' })
    .eq('id', leaseApproved.body[0].id);
  const retryPerson = await person('Retry'),
    retry = await propose(retryPerson),
    retryApproved = await approve(retry.body[0]);
  await admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 });
  await admin.rpc('start_automation_job', {
    p_job_id: retryApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  const retryResult = await admin.rpc('fail_automation_job', {
    p_job_id: retryApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_code: 'TRANSIENT_NETWORK',
    p_summary: 'Synthetic transient',
    p_retry_at: new Date(Date.now() + 1000).toISOString(),
  });
  assert(retryResult.data[0].status === 'QUEUED', 'transient failure did not schedule retry');
  await admin
    .from('automation_jobs')
    .update({ status: 'BLOCKED', failure_code: 'RUNTIME_ISOLATION' })
    .eq('id', retryApproved.body[0].id);
  const permanentPerson = await person('Permanent'),
    permanent = await propose(permanentPerson),
    permanentApproved = await approve(permanent.body[0]);
  await admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 });
  await admin.rpc('start_automation_job', {
    p_job_id: permanentApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  const permanentResult = await admin.rpc('fail_automation_job', {
    p_job_id: permanentApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_code: 'INVALID_TARGET',
    p_summary: 'Synthetic invalid target',
    p_retry_at: null,
  });
  assert(permanentResult.data[0].status === 'FAILED', 'permanent failure was retried');
  const maxPerson = await person('Max'),
    max = await propose(maxPerson),
    maxApproved = await approve(max.body[0]);
  await admin.rpc('claim_next_automation_job', { p_agent_id: agent.data.id, p_lease_seconds: 60 });
  await admin.rpc('start_automation_job', {
    p_job_id: maxApproved.body[0].id,
    p_agent_id: agent.data.id,
  });
  await admin.from('automation_jobs').update({ attempt_count: 3 }).eq('id', maxApproved.body[0].id);
  const maxResult = await admin.rpc('fail_automation_job', {
    p_job_id: maxApproved.body[0].id,
    p_agent_id: agent.data.id,
    p_code: 'TRANSIENT_NETWORK',
    p_summary: 'Synthetic max attempts',
    p_retry_at: null,
  });
  assert(maxResult.data[0].status === 'FAILED', 'max attempts did not stop retries');
  console.log(
    JSON.stringify({
      status: 'PASS',
      policyVersion: active.body[0].version,
      dnc: 'BLOCK',
      missingConsent: 'BLOCK',
      approvalConcurrency: 'single-winner',
      approvalExpiry: 'reapproval-required',
      idempotency: 'one-job',
      semanticDuplicate: 'BLOCKED',
      contentChange: 'invalidated',
      consentWithdrawal: 'blocked',
      policyChange: 'blocked',
      claimConcurrency: 'at-most-once',
      claimCancel: 'single-outcome',
      leaseRecovery: 'requeued',
      transientRetry: 'scheduled',
      maxAttempts: 'FAILED',
      permanentFailure: 'FAILED',
      dryRun: 'COMPLETED_NO_SIDE_EFFECT',
      manualAction: 'SECURITY_CHECKPOINT',
      unknownOutcome: 'MANUAL_ACTION_REQUIRED',
      mergedPerson: 'BLOCKED',
      closedOpportunity: 'BLOCKED',
      disabledAgent: 'denied',
    }),
  );
} finally {
  await admin
    .from('automation_job_events')
    .delete()
    .in(
      'job_id',
      (
        await admin.from('automation_jobs').select('id').like('source_reference', 'runtime%')
      ).data?.map((x) => x.id) ?? [],
    );
  await admin
    .from('automation_approvals')
    .delete()
    .in(
      'job_id',
      (
        await admin.from('automation_jobs').select('id').eq('source_reference', 'runtime')
      ).data?.map((x) => x.id) ?? [],
    );
  await admin
    .from('automation_actions')
    .delete()
    .in(
      'job_id',
      (
        await admin.from('automation_jobs').select('id').like('source_reference', 'runtime%')
      ).data?.map((x) => x.id) ?? [],
    );
  await admin.from('automation_jobs').delete().like('source_reference', 'runtime%');
  await admin.from('automation_policy_versions').update({ active: false }).neq('version', 1);
  await admin.from('automation_policy_versions').update({ active: true }).eq('version', 1);
  await admin.from('automation_policy_versions').delete().neq('version', 1);
  if (created.people.length) {
    await admin.from('consents').delete().in('person_id', created.people);
    await admin.from('people').delete().in('id', created.people);
  }
  for (const id of created.users.reverse()) await admin.auth.admin.deleteUser(id);
}
