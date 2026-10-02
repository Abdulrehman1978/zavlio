import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  agentId = process.argv[2];
if (!url || !key || !agentId)
  throw new Error('Usage: pnpm automation:tick -- <agent-uuid> with local server credentials.');
const db = createClient(url, key, { auth: { persistSession: false } });
const recovered = await db.rpc('recover_expired_automation_jobs', {
  p_as_of: new Date().toISOString(),
});
if (recovered.error) throw recovered.error;
const claimed = await db.rpc('claim_next_automation_job', {
  p_agent_id: agentId,
  p_lease_seconds: 300,
});
if (claimed.error) throw claimed.error;
if (!claimed.data?.length) {
  console.log(JSON.stringify({ status: 'IDLE', recovered: recovered.data }));
  process.exit(0);
}
const job = claimed.data[0];
if (!job.dry_run) throw new Error('Packet 13 tick refuses non-dry-run jobs.');
const started = await db.rpc('start_automation_job', { p_job_id: job.id, p_agent_id: agentId });
if (started.error) throw started.error;
if (started.data[0].status !== 'RUNNING') {
  console.log(JSON.stringify({ status: started.data[0].status, jobId: job.id }));
  process.exit(0);
}
const done = await db.rpc('complete_automation_job', {
  p_job_id: job.id,
  p_agent_id: agentId,
  p_evidence: { executor: 'PACKET13_LOCAL_TICK' },
});
if (done.error) throw done.error;
console.log(
  JSON.stringify({ status: 'DRY_RUN_COMPLETED', jobId: job.id, recovered: recovered.data }),
);
