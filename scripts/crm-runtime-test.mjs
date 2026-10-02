import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
if (!url || !anonKey || !serviceKey || !jwtSecret)
  throw new Error(
    'CRM runtime test requires local Supabase URL, anon key, service key, and JWT secret.',
  );
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = Date.now().toString(36);
const users = new Map();
const profiles = new Map();
const created = {
  people: [],
  orgs: [],
  identities: [],
  candidates: [],
  forms: [],
  visitors: [],
  sessions: [],
  events: [],
  consents: [],
  scores: [],
  opportunities: [],
  tasks: [],
  notes: [],
  conversations: [],
  messages: [],
};

function assert(condition, message) {
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
async function rest(role, table, method = 'GET', body, query = 'select=*') {
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${users.get(role)?.token ?? ''}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function rpc(role, name, body) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${users.get(role)?.token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function insert(table, rows) {
  const result = await admin.from(table).insert(rows).select('id');
  if (result.error) throw result.error;
  return result.data;
}
async function createFixtureUser(role, active = true) {
  const email = `packet10-${role.toLowerCase()}-${suffix}@example.test`;
  const createdUser = await admin.auth.admin.createUser({
    email,
    password: 'Packet10-Local-Password-123!',
    email_confirm: true,
  });
  if (createdUser.error || !createdUser.data.user)
    throw createdUser.error ?? new Error('fixture user failed');
  const profile = await admin
    .from('staff_profiles')
    .insert({
      auth_user_id: createdUser.data.user.id,
      email,
      name: `Packet 10 ${role}`,
      role: role === 'NONSTAFF' ? 'VIEWER' : role,
      active,
    })
    .select('id')
    .single();
  if (profile.error) throw profile.error;
  users.set(role, { id: createdUser.data.user.id, token: jwtFor(createdUser.data.user.id), email });
  profiles.set(role, profile.data.id);
}

try {
  for (const [role, active] of [
    ['OWNER', true],
    ['ADMIN', true],
    ['OPERATOR', true],
    ['VIEWER', true],
    ['NONSTAFF', false],
  ])
    await createFixtureUser(role, active);
  const orgs = await insert('organizations', [
    { name: `Packet 10 Org A ${suffix}`, domain: `packet10-a-${suffix}.example.test` },
    { name: `Packet 10 Org B ${suffix}`, domain: `packet10-b-${suffix}.example.test` },
  ]);
  created.orgs.push(...orgs.map((row) => row.id));
  const people = await insert('people', [
    {
      display_name: `Packet 10 Source ${suffix}`,
      primary_email: `source-${suffix}@example.test`,
      organization_id: created.orgs[0],
      lifecycle_stage: 'ENGAGED',
      do_not_contact: true,
      first_touch_source: 'Instagram',
      latest_touch_source: 'Instagram',
      last_activity_at: '2026-01-01T00:00:00Z',
    },
    {
      display_name: `Packet 10 Survivor ${suffix}`,
      primary_email: `survivor-${suffix}@example.test`,
      organization_id: created.orgs[1],
      lifecycle_stage: 'QUALIFIED',
      do_not_contact: false,
      first_touch_source: 'Google',
      latest_touch_source: 'Google',
      last_activity_at: '2026-02-01T00:00:00Z',
    },
  ]);
  created.people.push(...people.map((row) => row.id));
  const sourceId = created.people[0];
  const targetId = created.people[1];
  const identities = await insert('identities', [
    {
      person_id: sourceId,
      provider: 'email',
      email: `source-${suffix}@example.test`,
      verified: false,
      confidence: 1,
      source: 'runtime',
    },
    {
      person_id: targetId,
      provider: 'email',
      email: `survivor-${suffix}@example.test`,
      verified: true,
      confidence: 1,
      source: 'runtime',
    },
  ]);
  created.identities.push(...identities.map((row) => row.id));
  const visitor = await insert('anonymous_visitors', [
    {
      linked_person_id: sourceId,
      first_source: 'Instagram',
      last_source: 'Google',
      session_count: 1,
    },
  ]);
  created.visitors.push(visitor[0].id);
  const session = await insert('sessions', [
    { visitor_id: created.visitors[0], person_id: sourceId, landing_page: '/services' },
  ]);
  created.sessions.push(session[0].id);
  const event = await insert('events', [
    {
      visitor_id: created.visitors[0],
      session_id: created.sessions[0],
      person_id: sourceId,
      event_name: 'page_viewed',
      page_path: '/services/technology',
    },
  ]);
  created.events.push(event[0].id);
  const consent = await insert('consents', [
    { person_id: sourceId, analytics: true, policy_version: '2026-09-v1', source: 'runtime' },
  ]);
  created.consents.push(consent[0].id);
  const stage = await admin.from('pipeline_stages').select('id').eq('slug', 'new').single();
  if (stage.error) throw stage.error;
  const opportunity = await insert('opportunities', [
    {
      person_id: sourceId,
      organization_id: created.orgs[0],
      title: `Source opportunity ${suffix}`,
      stage_id: stage.data.id,
    },
  ]);
  created.opportunities.push(opportunity[0].id);
  const task = await insert('tasks', [
    {
      person_id: sourceId,
      opportunity_id: created.opportunities[0],
      title: `Source task ${suffix}`,
    },
  ]);
  created.tasks.push(task[0].id);
  const note = await insert('notes', [
    {
      person_id: sourceId,
      body: `Synthetic Packet 10 note ${suffix}`,
      author_id: profiles.get('OPERATOR'),
    },
  ]);
  created.notes.push(note[0].id);
  const conversation = await insert('conversations', [{ person_id: sourceId, channel: 'email' }]);
  created.conversations.push(conversation[0].id);
  const message = await insert('messages', [
    {
      conversation_id: created.conversations[0],
      person_id: sourceId,
      direction: 'INBOUND',
      channel: 'email',
      body: `Synthetic Packet 10 message ${suffix}`,
      received_at: new Date().toISOString(),
    },
  ]);
  created.messages.push(message[0].id);
  const form = await insert('form_submissions', [
    {
      person_id: sourceId,
      form_type: 'CONTACT',
      schema_version: 'CONTACT_V1',
      payload: { company: 'Packet 10', message: 'Synthetic' },
      idempotency_key: randomUUID(),
      status: 'PROCESSED',
    },
  ]);
  created.forms.push(form[0].id);
  const candidate = await insert('identity_match_candidates', [
    {
      person_a: sourceId,
      person_b: targetId,
      confidence: 0.82,
      match_reasons: { reason: 'runtime duplicate' },
    },
  ]);
  created.candidates.push(candidate[0].id);

  const viewerCandidates = await rest('VIEWER', 'identity_match_candidates');
  assert(
    viewerCandidates.status >= 200 &&
      viewerCandidates.status < 300 &&
      viewerCandidates.body.length === 0,
    'viewer can read identity candidates',
  );
  const operatorCandidates = await rest('OPERATOR', 'identity_match_candidates');
  assert(
    operatorCandidates.status >= 200 &&
      operatorCandidates.status < 300 &&
      operatorCandidates.body.length === 1,
    `operator cannot read pending identity candidate: ${operatorCandidates.status} ${JSON.stringify(operatorCandidates.body)}`,
  );
  const viewerNote = await rest('VIEWER', 'notes', 'POST', {
    person_id: targetId,
    body: 'viewer should fail',
  });
  assert(viewerNote.status >= 400, 'viewer created a note');
  const operatorClear = await rest(
    'OPERATOR',
    'people',
    'PATCH',
    { do_not_contact: false },
    `id=eq.${sourceId}&select=id`,
  );
  assert(operatorClear.status >= 400, 'operator cleared DNC directly');
  const operatorMerge = await rpc('OPERATOR', 'merge_people', {
    p_source_person_id: sourceId,
    p_target_person_id: targetId,
    p_candidate_id: created.candidates[0],
    p_reason: 'operator should fail',
  });
  assert(operatorMerge.status >= 400, 'operator executed merge');

  const merged = await rpc('ADMIN', 'merge_people', {
    p_source_person_id: sourceId,
    p_target_person_id: targetId,
    p_candidate_id: created.candidates[0],
    p_reason: 'Synthetic duplicate review',
  });
  assert(
    merged.status >= 200 &&
      merged.status < 300 &&
      merged.body?.[0]?.canonical_person_id === targetId,
    `admin merge did not return survivor: ${merged.status} ${JSON.stringify(merged.body)}`,
  );
  const sourceAfter = await admin
    .from('people')
    .select('lifecycle_stage,merged_into_person_id')
    .eq('id', sourceId)
    .single();
  const targetAfter = await admin
    .from('people')
    .select('do_not_contact,first_touch_source,latest_touch_source')
    .eq('id', targetId)
    .single();
  assert(
    sourceAfter.data?.lifecycle_stage === 'ARCHIVED' &&
      sourceAfter.data.merged_into_person_id === targetId,
    'source was not archived canonically',
  );
  assert(
    targetAfter.data?.do_not_contact === true &&
      targetAfter.data.first_touch_source === 'Google' &&
      targetAfter.data.latest_touch_source === 'Google',
    'merge field policy lost target suppression/attribution',
  );
  for (const table of [
    'sessions',
    'events',
    'consents',
    'form_submissions',
    'opportunities',
    'tasks',
    'notes',
    'conversations',
    'messages',
  ]) {
    const result = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('person_id', targetId);
    if (result.error || (result.count ?? 0) < 1) throw new Error(`merge did not preserve ${table}`);
  }
  const mergeHistory = await admin
    .from('person_merges')
    .select('id')
    .eq('source_person_id', sourceId)
    .eq('target_person_id', targetId);
  assert(!mergeHistory.error && mergeHistory.data.length === 1, 'merge provenance missing');
  const timeline = await rpc('ADMIN', 'crm_person_timeline', {
    p_person_id: targetId,
    p_category: 'ALL',
    p_limit: 50,
  });
  assert(
    timeline.status >= 200 &&
      timeline.body.some((item) => item.item_type === 'NOTE_CREATED') &&
      timeline.body.some((item) => item.item_type === 'CONTACT'),
    'timeline did not include merged CRM history',
  );

  const rollbackPeople = await insert('people', [
    {
      display_name: `Packet 10 Rollback ${suffix}`,
      primary_email: `rollback-${suffix}@example.test`,
    },
    {
      display_name: `Packet 10 Rollback Target ${suffix}`,
      primary_email: `rollback-target-${suffix}@example.test`,
    },
  ]);
  created.people.push(...rollbackPeople.map((row) => row.id));
  const rollbackResult = await rpc('ADMIN', 'merge_people', {
    p_source_person_id: rollbackPeople[0].id,
    p_target_person_id: rollbackPeople[1].id,
    p_reason: '__PACKET10_TEST_FAILURE__',
  });
  assert(rollbackResult.status >= 400, 'forced merge failure unexpectedly succeeded');
  const rollbackCheck = await admin
    .from('people')
    .select('lifecycle_stage,merged_into_person_id')
    .eq('id', rollbackPeople[0].id)
    .single();
  assert(
    rollbackCheck.data?.lifecycle_stage !== 'ARCHIVED' &&
      rollbackCheck.data?.merged_into_person_id === null,
    'failed merge partially changed source',
  );

  const concurrentPeople = await insert('people', [
    {
      display_name: `Packet 10 Concurrent Source ${suffix}`,
      primary_email: `concurrent-${suffix}@example.test`,
    },
    { display_name: `Packet 10 Concurrent B ${suffix}` },
    { display_name: `Packet 10 Concurrent C ${suffix}` },
  ]);
  created.people.push(...concurrentPeople.map((row) => row.id));
  const concurrent = await Promise.all([
    rpc('ADMIN', 'merge_people', {
      p_source_person_id: concurrentPeople[0].id,
      p_target_person_id: concurrentPeople[1].id,
      p_reason: 'concurrency A',
    }),
    rpc('ADMIN', 'merge_people', {
      p_source_person_id: concurrentPeople[0].id,
      p_target_person_id: concurrentPeople[2].id,
      p_reason: 'concurrency B',
    }),
  ]);
  assert(
    concurrent.filter((result) => result.status >= 200 && result.status < 300).length === 1 &&
      concurrent.filter((result) => result.status >= 400).length === 1,
    'concurrent merge did not serialize to one winner',
  );

  const intakeResponse = await fetch(`${webUrl}/api/forms/contact`, {
    method: 'POST',
    headers: {
      origin: webUrl,
      'content-type': 'application/json',
      'user-agent': `packet10-merged-intake-${suffix}`,
    },
    body: JSON.stringify({
      name: 'Merged identity intake',
      email: `source-${suffix}@example.test`,
      message: 'Merged identity regression',
      idempotencyKey: randomUUID(),
      formVersion: 'CONTACT_V1',
      honeypot: '',
    }),
  });
  const intakeBody = await intakeResponse.json();
  const intakeSubmission = intakeBody.submissionId
    ? await admin
        .from('form_submissions')
        .select('id,person_id')
        .eq('id', intakeBody.submissionId)
        .maybeSingle()
    : { data: null, error: null };
  assert(
    intakeResponse.status === 201 && intakeSubmission.data?.person_id === targetId,
    `Packet 09 intake did not resolve merged identity to survivor: ${intakeResponse.status} ${JSON.stringify(intakeBody)} submission=${JSON.stringify(intakeSubmission.data)} error=${JSON.stringify(intakeSubmission.error)} expected ${targetId}`,
  );
  if (intakeBody.submissionId) created.forms.push(intakeBody.submissionId);
  const adminClear = await rest(
    'ADMIN',
    'people',
    'PATCH',
    { do_not_contact: false },
    `id=eq.${targetId}&select=id`,
  );
  assert(adminClear.status >= 200 && adminClear.status < 300, 'admin could not clear DNC');
  const finalTarget = await admin
    .from('people')
    .select('do_not_contact')
    .eq('id', targetId)
    .single();
  assert(finalTarget.data?.do_not_contact === false, 'admin DNC clear did not persist');
  console.log(
    'Packet 10 CRM runtime passed: role matrix, candidate visibility, guarded DNC, atomic merge, provenance, relation preservation, rollback, concurrency, timeline, and merged-person intake regression.',
  );
} finally {
  if (created.people.length)
    await admin
      .from('person_merges')
      .delete()
      .or(
        `source_person_id.in.(${created.people.join(',')}),target_person_id.in.(${created.people.join(',')})`,
      );
  for (const [table, key] of [
    ['messages', 'messages'],
    ['conversations', 'conversations'],
    ['notes', 'notes'],
    ['tasks', 'tasks'],
    ['opportunities', 'opportunities'],
    ['form_submissions', 'forms'],
    ['events', 'events'],
    ['sessions', 'sessions'],
    ['consents', 'consents'],
    ['identities', 'identities'],
    ['anonymous_visitors', 'visitors'],
    ['identity_match_candidates', 'candidates'],
  ])
    if (created[key].length) await admin.from(table).delete().in('id', created[key]);
  if (created.people.length) await admin.from('people').delete().in('id', created.people);
  if (created.orgs.length) await admin.from('organizations').delete().in('id', created.orgs);
  for (const role of ['NONSTAFF', 'VIEWER', 'OPERATOR', 'ADMIN', 'OWNER']) {
    const profileId = profiles.get(role);
    if (profileId) await admin.from('staff_profiles').delete().eq('id', profileId);
    const user = users.get(role);
    if (user?.id) await admin.auth.admin.deleteUser(user.id);
  }
}
