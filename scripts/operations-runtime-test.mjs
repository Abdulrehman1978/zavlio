import { recalculateLeadScore } from '@zavlio/crm/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.SUPABASE_JWT_SECRET;
if (!url || !anon || !service || !secret)
  throw new Error('Packet 11 runtime requires local Supabase credentials.');
const admin = createClient(url, service, { auth: { persistSession: false } });
const suffix = Date.now().toString(36);
const created = {
  users: [],
  profiles: [],
  people: [],
  opportunities: [],
  tasks: [],
  sessions: [],
  events: [],
  forms: [],
  scores: [],
};
const users = new Map();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
function jwtFor(id) {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const h = enc({ alg: 'HS256', typ: 'JWT' });
  const p = enc({
    aud: 'authenticated',
    role: 'authenticated',
    sub: id,
    iss: `${url}/auth/v1`,
    iat: now,
    exp: now + 3600,
  });
  const input = `${h}.${p}`;
  return `${input}.${createHmac('sha256', secret).update(input).digest('base64url')}`;
}
async function fixture(role, active = true) {
  const email = `packet11-${role.toLowerCase()}-${active ? 'active' : 'inactive'}-${suffix}@example.test`;
  const auth = await admin.auth.admin.createUser({
    email,
    password: 'Packet11-Local-Password-123!',
    email_confirm: true,
  });
  if (auth.error || !auth.data.user) throw auth.error;
  created.users.push(auth.data.user.id);
  const profile = await admin
    .from('staff_profiles')
    .insert({ auth_user_id: auth.data.user.id, email, name: `Packet 11 ${role}`, role, active })
    .select('id')
    .single();
  if (profile.error) throw profile.error;
  created.profiles.push(profile.data.id);
  users.set(`${role}-${active}`, { id: profile.data.id, token: jwtFor(auth.data.user.id) });
}
async function rpc(who, name, args) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${users.get(who)?.token}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(args),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
try {
  for (const role of ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']) await fixture(role);
  await fixture('OPERATOR', false);
  const nonstaff = await admin.auth.admin.createUser({
    email: `packet11-nonstaff-${suffix}@example.test`,
    password: 'Packet11-Local-Password-123!',
    email_confirm: true,
  });
  if (nonstaff.error) throw nonstaff.error;
  created.users.push(nonstaff.data.user.id);
  users.set('NONSTAFF-true', { token: jwtFor(nonstaff.data.user.id) });
  const person = await admin
    .from('people')
    .insert({
      display_name: 'Packet 11 Lead',
      primary_email: `packet11-lead-${suffix}@example.test`,
    })
    .select('id')
    .single();
  if (person.error) throw person.error;
  created.people.push(person.data.id);
  const visitor = await admin
    .from('anonymous_visitors')
    .insert({ linked_person_id: person.data.id })
    .select('id')
    .single();
  if (visitor.error) throw visitor.error;
  const sessions = await admin
    .from('sessions')
    .insert([
      {
        visitor_id: visitor.data.id,
        person_id: person.data.id,
        started_at: '2026-09-25T10:00:00Z',
      },
      {
        visitor_id: visitor.data.id,
        person_id: person.data.id,
        started_at: '2026-09-27T10:00:00Z',
      },
    ])
    .select('id,started_at');
  if (sessions.error) throw sessions.error;
  created.sessions.push(...sessions.data.map((x) => x.id));
  const events = await admin
    .from('events')
    .insert([
      {
        person_id: person.data.id,
        visitor_id: visitor.data.id,
        session_id: sessions.data[1].id,
        event_name: 'service_viewed',
        page_path: '/services/web',
        occurred_at: '2026-09-27T10:05:00Z',
        metadata: { serviceKey: 'web' },
      },
      {
        person_id: person.data.id,
        visitor_id: visitor.data.id,
        session_id: sessions.data[1].id,
        event_name: 'page_viewed',
        page_path: '/',
        occurred_at: '2026-09-27T10:06:00Z',
        metadata: {},
      },
    ])
    .select('id');
  if (events.error) throw events.error;
  created.events.push(...events.data.map((x) => x.id));
  const form = await admin
    .from('form_submissions')
    .insert({
      person_id: person.data.id,
      form_type: 'START_A_PROJECT',
      payload: { services: ['web', 'ai_automation'], budget: '100000' },
      status: 'PROCESSED',
      idempotency_key: randomUUID(),
      submitted_at: '2026-09-27T10:10:00Z',
    })
    .select('id')
    .single();
  if (form.error) throw form.error;
  created.forms.push(form.data.id);
  const intakeScore = await admin
    .from('lead_scores')
    .insert({
      person_id: person.data.id,
      score: 55,
      intent_level: 'WARM',
      service_interest: { primary: 'web', source: 'packet_09_fixture' },
      reasoning: { source: 'packet_09_fixture' },
      model_version: 'PACKET_09_INTAKE_V1',
      calculated_at: '2026-09-27T11:00:00Z',
    })
    .select('id')
    .single();
  if (intakeScore.error) throw intakeScore.error;
  created.scores.push(intakeScore.data.id);
  const score = await recalculateLeadScore(admin, admin, person.data.id, {
    asOf: new Date('2026-09-27T12:00:00Z'),
  });
  assert(
    score.score === 84 && score.intent === 'HIGH',
    `unexpected deterministic score ${score.score}/${score.intent}`,
  );
  assert(
    score.affinity.primary === 'web' && score.affinity.secondary === 'ai_automation',
    'affinity result incorrect',
  );
  const unchanged = await recalculateLeadScore(admin, admin, person.data.id, {
    asOf: new Date('2026-09-27T12:00:00Z'),
  });
  assert(!unchanged.persisted, 'unchanged score created duplicate history');
  const scoreRows = await admin
    .from('lead_scores')
    .select('id,model_version')
    .eq('person_id', person.data.id);
  assert(
    scoreRows.data?.some((row) => row.model_version === 'PACKET_09_INTAKE_V1') &&
      scoreRows.data.some((row) => row.model_version === 'ZAVLIO_LEAD_V1'),
    'Packet 09 score was not preserved beside Packet 11 history',
  );
  created.scores.push(
    ...(scoreRows.data ?? []).filter((row) => row.id !== intakeScore.data.id).map((row) => row.id),
  );
  const stages = await admin.from('pipeline_stages').select('id,slug');
  if (stages.error) throw stages.error;
  const bySlug = new Map(stages.data.map((x) => [x.slug, x.id]));
  const opportunity = await admin
    .from('opportunities')
    .insert({
      person_id: person.data.id,
      title: 'Packet 11 opportunity',
      stage_id: bySlug.get('new'),
      owner_id: users.get('OPERATOR-true').id,
      estimated_value: 250000,
      currency: 'INR',
    })
    .select('*')
    .single();
  if (opportunity.error) throw opportunity.error;
  created.opportunities.push(opportunity.data.id);
  const viewerMove = await rpc('VIEWER-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('qualified'),
    p_expected_updated_at: opportunity.data.updated_at,
    p_reason: null,
    p_lost_reason: null,
  });
  assert(viewerMove.status >= 400, 'VIEWER moved opportunity');
  const moved = await rpc('OPERATOR-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('qualified'),
    p_expected_updated_at: opportunity.data.updated_at,
    p_reason: 'Qualified by staff',
    p_lost_reason: null,
  });
  assert(moved.status < 300, 'OPERATOR stage move failed');
  const qualified = moved.body[0];
  const noReason = await rpc('OPERATOR-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('lost'),
    p_expected_updated_at: qualified.updated_at,
    p_reason: null,
    p_lost_reason: null,
  });
  assert(noReason.status >= 400, 'Lost accepted without reason');
  const won = await rpc('OPERATOR-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('won'),
    p_expected_updated_at: qualified.updated_at,
    p_reason: 'Contract signed',
    p_lost_reason: null,
  });
  assert(won.status < 300, 'Won transition failed');
  const lifecycle = await admin
    .from('people')
    .select('lifecycle_stage')
    .eq('id', person.data.id)
    .single();
  assert(lifecycle.data.lifecycle_stage === 'CLIENT', 'Won did not set CLIENT lifecycle');
  const operatorReopen = await rpc('OPERATOR-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('discovery'),
    p_expected_updated_at: won.body[0].updated_at,
    p_reason: 'Reopen',
    p_lost_reason: null,
  });
  assert(operatorReopen.status >= 400, 'OPERATOR reopened closed opportunity');
  const reopened = await rpc('ADMIN-true', 'transition_opportunity_stage', {
    p_opportunity_id: opportunity.data.id,
    p_target_stage_id: bySlug.get('discovery'),
    p_expected_updated_at: won.body[0].updated_at,
    p_reason: 'Administrative reopen',
    p_lost_reason: null,
  });
  assert(reopened.status < 300, 'ADMIN reopen failed');
  const concurrent = await Promise.all([
    rpc('OPERATOR-true', 'transition_opportunity_stage', {
      p_opportunity_id: opportunity.data.id,
      p_target_stage_id: bySlug.get('proposal'),
      p_expected_updated_at: reopened.body[0].updated_at,
      p_reason: 'A',
      p_lost_reason: null,
    }),
    rpc('ADMIN-true', 'transition_opportunity_stage', {
      p_opportunity_id: opportunity.data.id,
      p_target_stage_id: bySlug.get('negotiation'),
      p_expected_updated_at: reopened.body[0].updated_at,
      p_reason: 'B',
      p_lost_reason: null,
    }),
  ]);
  assert(
    concurrent.filter((x) => x.status < 300).length === 1,
    'concurrent stage transitions did not single-win',
  );
  const badAssignee = await rpc('OPERATOR-true', 'create_crm_task', {
    p_person_id: person.data.id,
    p_opportunity_id: opportunity.data.id,
    p_assigned_to: users.get('OPERATOR-false').id,
    p_title: 'Bad assignment',
    p_description: null,
    p_due_at: null,
    p_priority: 'NORMAL',
  });
  assert(badAssignee.status >= 400, 'inactive staff assignment accepted');
  const viewerTask = await rpc('VIEWER-true', 'create_crm_task', {
    p_person_id: person.data.id,
    p_opportunity_id: opportunity.data.id,
    p_assigned_to: null,
    p_title: 'Viewer task',
    p_description: null,
    p_due_at: null,
    p_priority: 'NORMAL',
  });
  assert(viewerTask.status >= 400, 'VIEWER created task');
  const task = await rpc('OPERATOR-true', 'create_crm_task', {
    p_person_id: person.data.id,
    p_opportunity_id: opportunity.data.id,
    p_assigned_to: users.get('OPERATOR-true').id,
    p_title: 'Follow up',
    p_description: 'Call lead',
    p_due_at: '2026-09-26T10:00:00Z',
    p_priority: 'HIGH',
  });
  assert(task.status < 300, 'OPERATOR task creation failed');
  created.tasks.push(task.body[0].id);
  const completed = await rpc('OPERATOR-true', 'update_crm_task', {
    p_id: task.body[0].id,
    p_expected_updated_at: task.body[0].updated_at,
    p_assigned_to: users.get('OPERATOR-true').id,
    p_title: 'Follow up',
    p_description: 'Call lead',
    p_due_at: '2026-09-26T10:00:00Z',
    p_priority: 'HIGH',
    p_status: 'COMPLETED',
  });
  assert(completed.status < 300 && completed.body[0].completed_at, 'task completion failed');
  const reopenedTask = await rpc('OPERATOR-true', 'update_crm_task', {
    p_id: task.body[0].id,
    p_expected_updated_at: completed.body[0].updated_at,
    p_assigned_to: users.get('OPERATOR-true').id,
    p_title: 'Follow up',
    p_description: 'Call lead',
    p_due_at: '2026-09-26T10:00:00Z',
    p_priority: 'HIGH',
    p_status: 'OPEN',
  });
  assert(
    reopenedTask.status < 300 && reopenedTask.body[0].completed_at === null,
    'task reopen did not clear completion',
  );
  const nonstaffPipeline = await fetch(`${url}/rest/v1/crm_pipeline_projection?select=id`, {
    headers: { apikey: anon, Authorization: `Bearer ${users.get('NONSTAFF-true').token}` },
  });
  assert(
    nonstaffPipeline.status >= 400 || (await nonstaffPipeline.json()).length === 0,
    'nonstaff read pipeline',
  );
  console.log(
    'Packet 11 operations runtime passed: deterministic scoring/history/affinity, role matrix, stage history/lost/won/reopen/concurrency, task assignment/completion/reopen, and nonstaff denial.',
  );
} finally {
  for (const id of created.tasks) await admin.from('audit_logs').delete().eq('entity_id', id);
  for (const id of created.tasks) await admin.from('tasks').delete().eq('id', id);
  for (const id of created.opportunities) {
    await admin.from('audit_logs').delete().eq('entity_id', id);
    await admin.from('opportunity_stage_history').delete().eq('opportunity_id', id);
    await admin.from('opportunities').delete().eq('id', id);
  }
  for (const id of created.forms) await admin.from('form_submissions').delete().eq('id', id);
  for (const id of created.events) await admin.from('events').delete().eq('id', id);
  for (const id of created.sessions) await admin.from('sessions').delete().eq('id', id);
  await admin.from('anonymous_visitors').delete().eq('linked_person_id', created.people[0]);
  for (const id of created.scores) await admin.from('lead_scores').delete().eq('id', id);
  for (const id of created.people) await admin.from('people').delete().eq('id', id);
  for (const id of created.profiles.reverse())
    await admin.from('staff_profiles').delete().eq('id', id);
  for (const id of created.users.reverse()) await admin.auth.admin.deleteUser(id);
}
