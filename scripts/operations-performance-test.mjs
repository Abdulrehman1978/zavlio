import { createClient } from '@supabase/supabase-js';
import { recalculateLeadScore } from '@zavlio/crm/server';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Local Supabase URL and service key are required.');
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = Date.now().toString(36);
const people = [];
const opportunities = [];
const tasks = [];
const events = [];
const visitors = [];
const sessions = [];
const forms = [];

async function timed(name, work) {
  const started = performance.now();
  const result = await work();
  const milliseconds = Number((performance.now() - started).toFixed(1));
  if (result?.error) throw result.error;
  return [name, milliseconds];
}

async function insertBatches(table, rows, ids, batchSize = 250) {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const result = await db
      .from(table)
      .insert(rows.slice(offset, offset + batchSize))
      .select('id');
    if (result.error) throw result.error;
    ids.push(...result.data.map((row) => row.id));
  }
}

try {
  await insertBatches(
    'people',
    Array.from({ length: 1000 }, (_, index) => ({
      first_name: 'Performance',
      last_name: suffix + '-' + index,
      display_name: 'Performance ' + suffix + '-' + index,
      lifecycle_stage: 'IDENTIFIED',
    })),
    people,
  );
  const stage = await db.from('pipeline_stages').select('id').eq('slug', 'new').single();
  if (stage.error) throw stage.error;
  await insertBatches(
    'opportunities',
    people.map((personId, index) => ({
      person_id: personId,
      stage_id: stage.data.id,
      title: 'Performance opportunity ' + suffix + '-' + index,
      estimated_value: 100000 + index,
      currency: 'INR',
    })),
    opportunities,
  );
  await insertBatches(
    'tasks',
    opportunities.flatMap((opportunityId, index) => [
      {
        person_id: people[index],
        opportunity_id: opportunityId,
        title: 'Performance follow-up ' + suffix + '-' + index,
        priority: index % 10 === 0 ? 'HIGH' : 'NORMAL',
        due_at: new Date(Date.now() + index * 60000).toISOString(),
      },
      {
        person_id: people[index],
        opportunity_id: opportunityId,
        title: 'Performance review ' + suffix + '-' + index,
        priority: 'LOW',
      },
    ]),
    tasks,
  );
  const scoringPeople = people.slice(0, 100);
  await insertBatches(
    'anonymous_visitors',
    scoringPeople.map((personId) => ({
      linked_person_id: personId,
      visitor_key: randomUUID(),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })),
    visitors,
  );
  await insertBatches(
    'sessions',
    scoringPeople.map((personId, index) => ({
      person_id: personId,
      visitor_id: visitors[index],
      started_at: new Date(Date.now() - index * 60000).toISOString(),
    })),
    sessions,
  );
  await insertBatches(
    'events',
    scoringPeople.flatMap((personId, index) =>
      Array.from({ length: 10 }, (_, eventIndex) => ({
        person_id: personId,
        visitor_id: visitors[index],
        session_id: sessions[index],
        event_name: eventIndex % 2 ? 'service_viewed' : 'page_viewed',
        page_path: eventIndex % 2 ? '/services/web' : '/',
        occurred_at: new Date(Date.now() - eventIndex * 60000).toISOString(),
        metadata: eventIndex % 2 ? { serviceKey: 'web' } : {},
      })),
    ),
    events,
  );
  await insertBatches(
    'form_submissions',
    scoringPeople.map((personId, index) => ({
      person_id: personId,
      form_type: 'START_A_PROJECT',
      status: 'PROCESSED',
      payload: { services: ['web', 'ai_automation'], budget: '100000' },
      idempotency_key: 'packet-11-performance-' + suffix + '-' + index,
      submitted_at: new Date().toISOString(),
    })),
    forms,
  );

  const evidence = [];
  evidence.push(
    await timed('people_projection_25', () =>
      db.from('crm_people_projection').select('*').limit(25),
    ),
  );
  evidence.push(
    await timed('pipeline_projection_25', () =>
      db.from('crm_pipeline_projection').select('*').limit(25),
    ),
  );
  evidence.push(
    await timed('pipeline_stage_filter_25', () =>
      db.from('crm_pipeline_projection').select('*').eq('stage_slug', 'new').limit(25),
    ),
  );
  evidence.push(
    await timed('task_projection_25', () =>
      db.from('crm_task_projection').select('*').eq('status', 'OPEN').limit(25),
    ),
  );
  evidence.push(
    await timed('single_score_no_persist', () =>
      recalculateLeadScore(db, db, scoringPeople[0], { persist: false }),
    ),
  );
  evidence.push(
    await timed('batch_score_100_no_persist', async () => {
      for (let offset = 0; offset < scoringPeople.length; offset += 10)
        await Promise.all(
          scoringPeople
            .slice(offset, offset + 10)
            .map((personId) => recalculateLeadScore(db, db, personId, { persist: false })),
        );
      return { error: null };
    }),
  );
  console.log(
    JSON.stringify(
      {
        dataset: {
          people: people.length,
          opportunities: opportunities.length,
          tasks: tasks.length,
          scoringPeople: scoringPeople.length,
          events: events.length,
        },
        timingsMilliseconds: Object.fromEntries(evidence),
        classification: 'local evidence, not a production SLO',
      },
      null,
      2,
    ),
  );
} finally {
  if (forms.length) await db.from('form_submissions').delete().in('id', forms);
  if (events.length) await db.from('events').delete().in('id', events);
  if (sessions.length) await db.from('sessions').delete().in('id', sessions);
  if (visitors.length) await db.from('anonymous_visitors').delete().in('id', visitors);
  for (let offset = 0; offset < tasks.length; offset += 250)
    await db
      .from('tasks')
      .delete()
      .in('id', tasks.slice(offset, offset + 250));
  for (let offset = 0; offset < opportunities.length; offset += 250)
    await db
      .from('opportunities')
      .delete()
      .in('id', opportunities.slice(offset, offset + 250));
  for (let offset = 0; offset < people.length; offset += 250)
    await db
      .from('people')
      .delete()
      .in('id', people.slice(offset, offset + 250));
}
