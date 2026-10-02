import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret = process.env.SUPABASE_JWT_SECRET;
if (!url || !anon || !service || !secret)
  throw new Error('Packet 12 reporting runtime requires local Supabase credentials.');
const admin = createClient(url, service, { auth: { persistSession: false } }),
  suffix = Date.now().toString(36);
const made = {
  users: [],
  profiles: [],
  people: [],
  visitors: [],
  sessions: [],
  events: [],
  forms: [],
  scores: [],
  opportunities: [],
  history: [],
  tasks: [],
};
const identities = new Map();
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};
function jwtFor(id) {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const h = enc({ alg: 'HS256', typ: 'JWT' }),
    p = enc({
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
async function user(label, role, active = true, staff = true) {
  const created = await admin.auth.admin.createUser({
    email: `packet12-${label}-${suffix}@example.test`,
    password: 'Packet12-Local-Password-123!',
    email_confirm: true,
  });
  if (created.error) throw created.error;
  made.users.push(created.data.user.id);
  if (staff) {
    const profile = await admin
      .from('staff_profiles')
      .insert({
        auth_user_id: created.data.user.id,
        email: `packet12-${label}-${suffix}@example.test`,
        name: `Packet 12 ${label}`,
        role,
        active,
      })
      .select('id')
      .single();
    if (profile.error) throw profile.error;
    made.profiles.push(profile.data.id);
  }
  identities.set(label, { token: jwtFor(created.data.user.id) });
}
async function rpc(label, name, args) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${identities.get(label).token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function insert(table, values, columns = 'id') {
  const response = await admin.from(table).insert(values).select(columns);
  if (response.error) throw response.error;
  return response.data;
}
const range = { p_start: '2026-08-31T18:30:00.000Z', p_end: '2026-09-30T18:30:00.000Z' };
try {
  for (const role of ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']) await user(role, role);
  await user('INACTIVE', 'VIEWER', false);
  await user('NONSTAFF', 'VIEWER', true, false);
  const stages = await admin.from('pipeline_stages').select('id,slug');
  if (stages.error) throw stages.error;
  const stage = Object.fromEntries(stages.data.map((x) => [x.slug, x.id]));
  const people = await insert(
    'people',
    Array.from({ length: 6 }, (_, i) => ({
      display_name: `Synthetic lead ${i + 1}`,
      primary_email: `lead-${i + 1}-${suffix}@example.test`,
      lead_source: i < 2 ? 'referral' : 'direct',
      first_touch_source: i === 0 ? 'google' : i === 1 ? 'linkedin' : null,
      created_at: `2026-09-${String(5 + i).padStart(2, '0')}T10:00:00Z`,
      lifecycle_stage: i === 5 ? 'ARCHIVED' : 'IDENTIFIED',
    })),
    'id',
  );
  made.people.push(...people.map((x) => x.id));
  const merge = await admin
    .from('people')
    .update({ merged_into_person_id: people[2].id, merged_at: '2026-09-20T10:00:00Z' })
    .eq('id', people[5].id);
  if (merge.error) throw merge.error;
  const visitors = await insert(
    'anonymous_visitors',
    Array.from({ length: 10 }, (_, i) => ({
      visitor_key: randomUUID(),
      first_seen_at: `2026-09-${String(1 + i).padStart(2, '0')}T08:00:00Z`,
      last_seen_at: '2026-09-20T08:00:00Z',
      first_source: i < 5 ? 'google' : 'direct',
      last_source: i % 2 ? 'linkedin' : 'google',
      linked_person_id: i < 2 ? people[i].id : null,
      session_count: i < 2 ? 2 : 1,
    })),
    'id',
  );
  made.visitors.push(...visitors.map((x) => x.id));
  const sessionValues = visitors.flatMap((v, i) => [
    {
      visitor_id: v.id,
      person_id: i < 2 ? people[i].id : null,
      started_at: `2026-09-${String(1 + i).padStart(2, '0')}T08:00:00Z`,
      last_activity_at: `2026-09-${String(1 + i).padStart(2, '0')}T08:20:00Z`,
      landing_page: i % 2 ? '/services/web' : '/',
      utm_source: i < 5 ? 'google' : null,
      utm_medium: i < 5 ? 'cpc' : null,
      utm_campaign: i < 5 ? 'launch' : null,
    },
    ...(i < 2
      ? [
          {
            visitor_id: v.id,
            person_id: people[i].id,
            started_at: `2026-09-${String(15 + i).padStart(2, '0')}T08:00:00Z`,
            last_activity_at: `2026-09-${String(15 + i).padStart(2, '0')}T08:15:00Z`,
            landing_page: '/contact',
            utm_source: 'linkedin',
            utm_medium: 'social',
            utm_campaign: 'followup',
          },
        ]
      : []),
  ]);
  const sessions = await insert('sessions', sessionValues, 'id,visitor_id');
  made.sessions.push(...sessions.map((x) => x.id));
  const events = await insert(
    'events',
    sessions.slice(0, 10).map((s, i) => ({
      visitor_id: s.visitor_id,
      session_id: s.id,
      person_id: i < 2 ? people[i].id : null,
      event_name: 'page_viewed',
      page_path: i % 2 ? '/services/web' : '/',
      occurred_at: `2026-09-${String(2 + i).padStart(2, '0')}T09:00:00Z`,
      consent_snapshot: { analytics: true },
    })),
    'id',
  );
  made.events.push(...events.map((x) => x.id));
  const formValues = [0, 0, 1, 2, 3, 4].map((personIndex, i) => ({
    person_id: people[personIndex].id,
    visitor_id: personIndex < 2 ? visitors[personIndex].id : null,
    form_type: i % 2 ? 'CONTACT' : 'START_A_PROJECT',
    payload: i === 0 ? { services: ['web', 'brand'] } : { services: ['web'] },
    status: 'PROCESSED',
    idempotency_key: `packet12-${suffix}-${i}`,
    schema_version: 'PACKET12_TEST',
    processed_at: `2026-09-${String(10 + i).padStart(2, '0')}T10:00:00Z`,
    submitted_at: `2026-09-${String(10 + i).padStart(2, '0')}T10:00:00Z`,
  }));
  const forms = await insert('form_submissions', formValues, 'id');
  made.forms.push(...forms.map((x) => x.id));
  const scores = await insert(
    'lead_scores',
    [
      {
        person_id: people[0].id,
        score: 75,
        intent_level: 'HIGH',
        model_version: 'ZAVLIO_LEAD_V1',
        calculated_at: '2026-09-28T08:00:00Z',
        service_interest: { primary: 'web' },
        reasoning: {},
      },
      {
        person_id: people[1].id,
        score: 90,
        intent_level: 'PRIORITY',
        model_version: 'ZAVLIO_LEAD_V1',
        calculated_at: '2026-09-28T08:00:00Z',
        service_interest: { primary: 'brand' },
        reasoning: {},
      },
      {
        person_id: people[2].id,
        score: 55,
        intent_level: 'WARM',
        model_version: 'ZAVLIO_LEAD_V1',
        calculated_at: '2026-09-01T08:00:00Z',
        service_interest: { primary: 'web' },
        reasoning: {},
      },
    ],
    'id',
  );
  made.scores.push(...scores.map((x) => x.id));
  const opportunities = await insert(
    'opportunities',
    [
      {
        person_id: people[0].id,
        title: 'Won INR',
        stage_id: stage.won,
        estimated_value: 100000,
        currency: 'INR',
        created_at: '2026-09-05T10:00:00Z',
      },
      {
        person_id: people[1].id,
        title: 'Reopened loss',
        stage_id: stage.new,
        estimated_value: null,
        currency: 'INR',
        created_at: '2026-09-06T10:00:00Z',
      },
      {
        person_id: people[2].id,
        title: 'Open USD',
        stage_id: stage.qualified,
        estimated_value: 1000,
        currency: 'USD',
        created_at: '2026-09-07T10:00:00Z',
      },
      {
        person_id: people[0].id,
        title: 'Second open INR',
        stage_id: stage.proposal,
        estimated_value: 50000,
        currency: 'INR',
        created_at: '2026-09-08T10:00:00Z',
      },
    ],
    'id',
  );
  made.opportunities.push(...opportunities.map((x) => x.id));
  const history = await insert(
    'opportunity_stage_history',
    [
      {
        opportunity_id: opportunities[0].id,
        from_stage_id: stage.proposal,
        to_stage_id: stage.won,
        changed_at: '2026-09-20T10:00:00Z',
        metadata: {},
      },
      {
        opportunity_id: opportunities[1].id,
        from_stage_id: stage.qualified,
        to_stage_id: stage.lost,
        changed_at: '2026-09-18T10:00:00Z',
        metadata: { lost_reason: 'BUDGET' },
      },
      {
        opportunity_id: opportunities[1].id,
        from_stage_id: stage.lost,
        to_stage_id: stage.new,
        changed_at: '2026-09-22T10:00:00Z',
        metadata: {},
      },
    ],
    'id',
  );
  made.history.push(...history.map((x) => x.id));
  const tasks = await insert(
    'tasks',
    [
      {
        person_id: people[0].id,
        title: 'Overdue assigned',
        assigned_to: made.profiles[2],
        status: 'OPEN',
        due_at: '2026-09-10T10:00:00Z',
      },
      {
        person_id: people[1].id,
        title: 'Unassigned',
        status: 'IN_PROGRESS',
        due_at: '2026-09-10T10:00:00Z',
      },
      {
        person_id: people[2].id,
        title: 'Completed',
        assigned_to: made.profiles[2],
        status: 'COMPLETED',
        completed_at: '2026-09-20T10:00:00Z',
        due_at: '2026-09-19T10:00:00Z',
      },
    ],
    'id',
  );
  made.tasks.push(...tasks.map((x) => x.id));

  const args = {
    ...range,
    p_previous_start: '2026-08-01T18:30:00.000Z',
    p_previous_end: '2026-08-31T18:30:00.000Z',
  };
  for (const role of ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'])
    assert(
      (await rpc(role, 'crm_analytics_overview', args)).status === 200,
      `${role} report access failed`,
    );
  assert(
    (await rpc('NONSTAFF', 'crm_analytics_overview', args)).status === 403,
    'nonstaff report access was not denied',
  );
  assert(
    (await rpc('INACTIVE', 'crm_analytics_overview', args)).status === 403,
    'inactive report access was not denied',
  );
  const overview = (await rpc('VIEWER', 'crm_analytics_overview', args)).body;
  assert(Number(overview.current.trackedVisitors) === 10, 'tracked visitor golden metric mismatch');
  assert(Number(overview.current.trackedSessions) === 12, 'tracked session golden metric mismatch');
  assert(
    Number(overview.current.returningTrackedVisitors) === 2,
    'returning visitor golden metric mismatch',
  );
  assert(Number(overview.current.enquiries) === 6, 'multiple enquiries must remain submissions');
  assert(Number(overview.current.newPeople) === 5, 'merged archived person was double counted');
  assert(
    Number(overview.current.attributedPeople) === 2,
    'non-consent people distorted tracked funnel',
  );
  assert(
    Number(overview.trackedFunnel.peopleWithOpportunity) === 2,
    'tracked people with opportunities mismatch',
  );
  assert(
    overview.openPipelineValue.some((x) => x.currency === 'USD') &&
      overview.openPipelineValue.some((x) => x.currency === 'INR'),
    'mixed currencies were not separated',
  );
  assert(
    Number(overview.wonOpportunityValue[0].amount) === 100000,
    'Won opportunity value mismatch',
  );
  const leads = (await rpc('VIEWER', 'crm_analytics_leads', range)).body;
  assert(
    leads.scoreModel === 'ZAVLIO_LEAD_V1' &&
      Number(leads.currentScored) === 3 &&
      Number(leads.currentUnscored) === 2,
    'score model/coverage mismatch',
  );
  const pipeline = (await rpc('VIEWER', 'crm_analytics_pipeline', range)).body;
  assert(
    Number(pipeline.wonTransitions) === 1 && Number(pipeline.lostTransitions) === 1,
    'historical outcome transitions mismatch',
  );
  assert(
    Number(pipeline.currentLostOpportunities) === 0,
    'reopened loss remained in current Lost snapshot',
  );
  assert(
    pipeline.lostReasons.some((x) => x.reason === 'BUDGET'),
    'reopened loss history lost its reason',
  );
  const operations = (await rpc('VIEWER', 'crm_analytics_operations', range)).body;
  assert(
    Number(operations.openTasksNow) === 2 && Number(operations.completedInPeriod) === 1,
    'task snapshot/period metrics mismatch',
  );
  const before = {
    people: (await admin.from('people').select('id', { count: 'exact', head: true })).count,
    scores: (await admin.from('lead_scores').select('id', { count: 'exact', head: true })).count,
  };
  await rpc('VIEWER', 'crm_analytics_acquisition', range);
  await rpc('VIEWER', 'crm_analytics_pipeline', range);
  const after = {
    people: (await admin.from('people').select('id', { count: 'exact', head: true })).count,
    scores: (await admin.from('lead_scores').select('id', { count: 'exact', head: true })).count,
  };
  assert(
    JSON.stringify(before) === JSON.stringify(after),
    'report loading caused a write side effect',
  );
  console.log(
    JSON.stringify({
      status: 'PASS',
      golden: {
        trackedVisitors: 10,
        trackedSessions: 12,
        enquiries: 6,
        canonicalPeople: 5,
        attributedPeople: 2,
        opportunities: 4,
        wonTransitions: 1,
        lostTransitions: 1,
      },
      roles: ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'],
      nonstaff: 'DENIED',
      inactive: 'DENIED',
      currency: ['INR', 'USD'],
      writes: 'NONE',
    }),
  );
} finally {
  for (const [table, key] of [
    ['opportunity_stage_history', 'history'],
    ['tasks', 'tasks'],
    ['opportunities', 'opportunities'],
    ['lead_scores', 'scores'],
    ['form_submissions', 'forms'],
    ['events', 'events'],
    ['sessions', 'sessions'],
    ['anonymous_visitors', 'visitors'],
    ['people', 'people'],
    ['staff_profiles', 'profiles'],
  ])
    if (made[key].length) await admin.from(table).delete().in('id', made[key]);
  for (const id of made.users) await admin.auth.admin.deleteUser(id);
}
