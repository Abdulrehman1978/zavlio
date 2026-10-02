import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret = process.env.SUPABASE_JWT_SECRET;
if (!url || !anon || !service || !secret)
  throw new Error('Local Supabase credentials are required.');
const db = createClient(url, service, { auth: { persistSession: false } }),
  suffix = Date.now().toString(36);
const made = {
  people: [],
  visitors: [],
  sessions: [],
  events: [],
  forms: [],
  scores: [],
  opportunities: [],
  history: [],
  tasks: [],
  profiles: [],
  users: [],
};
const now = new Date(),
  start = new Date(now.getTime() - 30 * 86400000),
  previous = new Date(start.getTime() - 30 * 86400000);
const jwtFor = (id) => {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url'),
    epoch = Math.floor(Date.now() / 1000),
    h = enc({ alg: 'HS256', typ: 'JWT' }),
    p = enc({
      aud: 'authenticated',
      role: 'authenticated',
      sub: id,
      iss: `${url}/auth/v1`,
      iat: epoch,
      exp: epoch + 3600,
    }),
    input = `${h}.${p}`;
  return `${input}.${createHmac('sha256', secret).update(input).digest('base64url')}`;
};
async function batches(table, values, ids, size = 250) {
  for (let i = 0; i < values.length; i += size) {
    const result = await db
      .from(table)
      .insert(values.slice(i, i + size))
      .select('id');
    if (result.error) throw result.error;
    ids.push(...result.data.map((x) => x.id));
  }
}
async function deleteBatches(table, ids, size = 100) {
  for (let i = 0; i < ids.length; i += size) {
    const result = await db
      .from(table)
      .delete()
      .in('id', ids.slice(i, i + size));
    if (result.error) throw result.error;
  }
}
async function timed(key, work) {
  const began = performance.now(),
    result = await work();
  if (result.error) throw result.error;
  return [key, Number((performance.now() - began).toFixed(1))];
}

function explain(name, userId, expression) {
  const claims = JSON.stringify({ sub: userId, role: 'authenticated' }).replaceAll("'", "''");
  const statement = `begin; set local "request.jwt.claims"='${claims}'; set local role authenticated; explain (analyze, buffers, format json) select ${expression}; rollback;`;
  const output = execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_zavlio-local',
      'psql',
      '-qAt',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-c',
      statement,
    ],
    { encoding: 'utf8' },
  ).trim();
  const plan = JSON.parse(output)[0];
  const blocks = (node) =>
    Number(node['Shared Hit Blocks'] ?? 0) +
    (node.Plans ?? []).reduce((total, child) => total + blocks(child), 0);
  return {
    report: name,
    planningMilliseconds: Number(plan['Planning Time'].toFixed(3)),
    executionMilliseconds: Number(plan['Execution Time'].toFixed(3)),
    rootNode: plan.Plan['Node Type'],
    actualRows: plan.Plan['Actual Rows'],
    sharedHitBlocks: blocks(plan.Plan),
  };
}
try {
  console.error('reporting-performance: creating staff');
  const auth = await db.auth.admin.createUser({
    email: `packet12-performance-${suffix}@example.test`,
    password: 'Packet12-Performance-123!',
    email_confirm: true,
  });
  if (auth.error) throw auth.error;
  made.users.push(auth.data.user.id);
  const profile = await db
    .from('staff_profiles')
    .insert({
      auth_user_id: auth.data.user.id,
      email: `packet12-performance-${suffix}@example.test`,
      name: 'Packet 12 Performance',
      role: 'VIEWER',
      active: true,
    })
    .select('id')
    .single();
  if (profile.error) throw profile.error;
  made.profiles.push(profile.data.id);
  const reader = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwtFor(auth.data.user.id)}` } },
    auth: { persistSession: false },
  });
  console.error('reporting-performance: inserting dataset');
  await batches(
    'people',
    Array.from({ length: 250 }, (_, i) => ({
      display_name: `Synthetic performance ${suffix}-${i}`,
      first_touch_source: i % 3 === 0 ? 'google' : i % 3 === 1 ? 'linkedin' : null,
      lead_source: i % 4 === 0 ? 'referral' : 'direct',
      created_at: new Date(start.getTime() + (i % 29) * 86400000).toISOString(),
    })),
    made.people,
  );
  await batches(
    'anonymous_visitors',
    Array.from({ length: 1000 }, (_, i) => ({
      visitor_key: randomUUID(),
      linked_person_id: i < 250 ? made.people[i] : null,
      first_source: i % 3 === 0 ? 'google' : i % 3 === 1 ? 'linkedin' : 'direct',
      first_landing_page: i % 2 ? '/' : '/services/web',
      first_seen_at: new Date(start.getTime() + (i % 29) * 86400000).toISOString(),
      last_seen_at: now.toISOString(),
      session_count: 2,
    })),
    made.visitors,
  );
  await batches(
    'sessions',
    Array.from({ length: 2000 }, (_, i) => ({
      visitor_id: made.visitors[i % 1000],
      person_id: i % 1000 < 250 ? made.people[i % 250] : null,
      started_at: new Date(
        start.getTime() + (i % 29) * 86400000 + (i % 24) * 3600000,
      ).toISOString(),
      last_activity_at: new Date(
        start.getTime() + (i % 29) * 86400000 + (i % 24) * 3600000 + 900000,
      ).toISOString(),
      landing_page: i % 2 ? '/' : '/services/web',
      utm_source: i % 3 === 0 ? 'google' : i % 3 === 1 ? 'linkedin' : null,
      utm_medium: i % 3 === 0 ? 'cpc' : null,
      utm_campaign: i % 5 === 0 ? 'launch' : null,
    })),
    made.sessions,
  );
  await batches(
    'events',
    Array.from({ length: 10000 }, (_, i) => ({
      visitor_id: made.visitors[i % 1000],
      session_id: made.sessions[i % 2000],
      person_id: i % 1000 < 250 ? made.people[i % 250] : null,
      event_name: i % 5 === 0 ? 'service_viewed' : 'page_viewed',
      page_path: i % 5 === 0 ? '/services/web' : '/',
      occurred_at: new Date(
        start.getTime() + (i % 29) * 86400000 + (i % 24) * 3600000,
      ).toISOString(),
      metadata: i % 5 === 0 ? { serviceSlug: 'web' } : {},
      consent_snapshot: { analytics: true },
    })),
    made.events,
  );
  await batches(
    'form_submissions',
    Array.from({ length: 200 }, (_, i) => ({
      person_id: made.people[i % 250],
      visitor_id: made.visitors[i],
      form_type: i % 2 ? 'CONTACT' : 'START_A_PROJECT',
      payload: { services: [i % 2 ? 'web' : 'brand'] },
      status: 'PROCESSED',
      idempotency_key: `packet12-performance-${suffix}-${i}`,
      schema_version: 'PACKET12_PERF',
      submitted_at: new Date(start.getTime() + (i % 29) * 86400000).toISOString(),
    })),
    made.forms,
  );
  await batches(
    'lead_scores',
    made.people.map((person, i) => ({
      person_id: person,
      score: i % 101,
      intent_level:
        i % 5 === 0
          ? 'PRIORITY'
          : i % 5 === 1
            ? 'HIGH'
            : i % 5 === 2
              ? 'WARM'
              : i % 5 === 3
                ? 'INTERESTED'
                : 'LOW',
      service_interest: { primary: i % 2 ? 'web' : 'brand' },
      reasoning: {},
      model_version: 'ZAVLIO_LEAD_V1',
      calculated_at: now.toISOString(),
    })),
    made.scores,
  );
  const stageRows = await db.from('pipeline_stages').select('id,slug');
  if (stageRows.error) throw stageRows.error;
  const stage = Object.fromEntries(stageRows.data.map((x) => [x.slug, x.id]));
  await batches(
    'opportunities',
    Array.from({ length: 150 }, (_, i) => ({
      person_id: made.people[i % 250],
      title: `Synthetic deal ${suffix}-${i}`,
      stage_id: i % 10 === 0 ? stage.won : i % 10 === 1 ? stage.lost : stage.new,
      estimated_value: i % 7 === 0 ? null : 10000 + i,
      currency: i % 9 === 0 ? 'USD' : 'INR',
      created_at: new Date(start.getTime() + (i % 29) * 86400000).toISOString(),
    })),
    made.opportunities,
  );
  await batches(
    'opportunity_stage_history',
    made.opportunities.slice(0, 50).map((opportunity, i) => ({
      opportunity_id: opportunity,
      from_stage_id: stage.new,
      to_stage_id: i % 2 ? stage.won : stage.lost,
      changed_at: new Date(start.getTime() + (i % 29) * 86400000 + 3600000).toISOString(),
      metadata: i % 2 ? {} : { lost_reason: 'BUDGET' },
    })),
    made.history,
  );
  await batches(
    'tasks',
    Array.from({ length: 500 }, (_, i) => ({
      person_id: made.people[i % 250],
      opportunity_id: made.opportunities[i % 150],
      title: `Synthetic task ${suffix}-${i}`,
      status: i % 5 === 0 ? 'COMPLETED' : 'OPEN',
      completed_at:
        i % 5 === 0 ? new Date(start.getTime() + (i % 29) * 86400000).toISOString() : null,
      due_at: new Date(start.getTime() + (i % 40) * 86400000).toISOString(),
    })),
    made.tasks,
  );
  const range = { p_start: start.toISOString(), p_end: now.toISOString() },
    overview = {
      ...range,
      p_previous_start: previous.toISOString(),
      p_previous_end: start.toISOString(),
    };
  console.error('reporting-performance: querying reports');
  const timings = [];
  console.error('reporting-performance: overview');
  timings.push(await timed('overview', () => reader.rpc('crm_analytics_overview', overview)));
  console.error('reporting-performance: acquisition');
  timings.push(await timed('acquisition', () => reader.rpc('crm_analytics_acquisition', range)));
  console.error('reporting-performance: lead quality');
  timings.push(await timed('leadQuality', () => reader.rpc('crm_analytics_leads', range)));
  console.error('reporting-performance: pipeline');
  timings.push(await timed('pipeline', () => reader.rpc('crm_analytics_pipeline', range)));
  console.error('reporting-performance: operations');
  timings.push(await timed('operations', () => reader.rpc('crm_analytics_operations', range)));
  console.error('reporting-performance: explain plans');
  const quote = (value) => `'${value}'::timestamptz`;
  const plans = [
    explain(
      'overview',
      auth.data.user.id,
      `public.crm_analytics_overview(${quote(range.p_start)},${quote(range.p_end)},${quote(overview.p_previous_start)},${quote(overview.p_previous_end)})`,
    ),
    explain(
      'acquisition',
      auth.data.user.id,
      `public.crm_analytics_acquisition(${quote(range.p_start)},${quote(range.p_end)})`,
    ),
    explain(
      'leadQuality',
      auth.data.user.id,
      `public.crm_analytics_leads(${quote(range.p_start)},${quote(range.p_end)})`,
    ),
    explain(
      'pipeline',
      auth.data.user.id,
      `public.crm_analytics_pipeline(${quote(range.p_start)},${quote(range.p_end)})`,
    ),
  ];
  console.log(
    JSON.stringify(
      {
        dataset: {
          trackedVisitors: 1000,
          sessions: 2000,
          events: 10000,
          people: 250,
          enquiries: 200,
          opportunities: 150,
          stageHistory: 50,
          tasks: 500,
          scores: 250,
        },
        timingsMilliseconds: Object.fromEntries(timings),
        plansReviewed: plans,
        classification: 'representative local RLS fixture, not a production SLO',
      },
      null,
      2,
    ),
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
    await deleteBatches(table, made[key]);
  for (const id of made.users) await db.auth.admin.deleteUser(id);
}
