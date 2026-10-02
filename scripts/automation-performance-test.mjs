import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error('Packet 13 performance test requires local Supabase credentials.');
const db = createClient(url, key, { auth: { persistSession: false } }),
  ids = [];
const fixtureSize = 3000;
try {
  for (let offset = 0; offset < fixtureSize; offset += 500) {
    const rows = Array.from({ length: Math.min(500, fixtureSize - offset) }, (_, i) => ({
      type: 'runtime',
      channel: 'test',
      status: (offset + i) % 5 === 0 ? 'AWAITING_APPROVAL' : 'QUEUED',
      payload: {},
      scheduled_for: new Date(Date.now() + (i % 20) * 60000).toISOString(),
      priority: (i % 5) - 2,
      idempotency_key: 'perf-' + randomUUID(),
      action_class: 'INTERNAL_ONLY',
      communication_purpose: 'INTERNAL',
      dry_run: true,
    }));
    const insert = await db.from('automation_jobs').insert(rows).select('id');
    if (insert.error) throw insert.error;
    ids.push(...insert.data.map((x) => x.id));
  }
  const timed = async (name, query) => {
    const start = performance.now(),
      result = await query;
    if (result.error) throw result.error;
    return {
      name,
      ms: Number((performance.now() - start).toFixed(2)),
      rows: result.data?.length ?? 0,
    };
  };
  const approval = await timed(
    'approvalQueue',
    db
      .from('crm_automation_jobs_projection')
      .select('id,status,created_at')
      .eq('status', 'AWAITING_APPROVAL')
      .order('created_at', { ascending: false })
      .limit(25),
  );
  const jobs = await timed(
    'jobList',
    db
      .from('crm_automation_jobs_projection')
      .select('id,status,scheduled_for')
      .order('created_at', { ascending: false })
      .limit(25),
  );
  const due = await timed(
    'claimCandidateRead',
    db
      .from('automation_jobs')
      .select('id')
      .eq('status', 'QUEUED')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for')
      .limit(1),
  );
  console.log(
    JSON.stringify({
      status: 'PASS',
      fixtureSize,
      approval,
      jobs,
      due,
      note: 'Local timings are not production SLOs.',
    }),
  );
} finally {
  for (let offset = 0; offset < ids.length; offset += 500)
    await db
      .from('automation_jobs')
      .delete()
      .in('id', ids.slice(offset, offset + 500));
}
