import 'server-only';
import { createServerSupabaseClient } from '../supabase/server';
export type AutomationRow = Record<string, unknown>;
const unwrap = <T>(data: T | null, error: { message: string } | null): T => {
  if (error) throw new Error(error.message);
  return data as T;
};
export async function loadAutomationOverview() {
  const db = await createServerSupabaseClient();
  const [{ data: jobs, error: je }, { data: agents, error: ae }, { data: policy, error: pe }] =
    await Promise.all([
      db
        .from('crm_automation_jobs_projection')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      db.from('crm_automation_agents_projection').select('*').order('name'),
      db.from('automation_policy_versions').select('*').eq('active', true).maybeSingle(),
    ]);
  const rows = unwrap(jobs, je) as unknown as AutomationRow[];
  return {
    jobs: rows,
    agents: unwrap(agents, ae) as unknown as AutomationRow[],
    policy: unwrap(policy, pe) as unknown as AutomationRow | null,
    counts: Object.fromEntries(
      [
        'AWAITING_APPROVAL',
        'QUEUED',
        'CLAIMED',
        'RUNNING',
        'BLOCKED',
        'MANUAL_ACTION_REQUIRED',
        'FAILED',
        'COMPLETED',
      ].map((status) => [status, rows.filter((row) => row.status === status).length]),
    ),
  };
}
export async function loadAutomationJobs(filters: {
  status?: string;
  channel?: string;
  purpose?: string;
  q?: string;
  page: number;
}) {
  const db = await createServerSupabaseClient();
  const from = (filters.page - 1) * 25;
  let query = db
    .from('crm_automation_jobs_projection')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + 24);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.channel) query = query.eq('channel', filters.channel);
  if (filters.purpose) query = query.eq('communication_purpose', filters.purpose);
  if (filters.q)
    query = query.or(
      'person_name.ilike.%' +
        filters.q.replaceAll(/[,%]/g, '') +
        '%,opportunity_title.ilike.%' +
        filters.q.replaceAll(/[,%]/g, '') +
        '%',
    );
  const { data, error, count } = await query;
  return { rows: unwrap(data, error) as unknown as AutomationRow[], count: count ?? 0 };
}
export async function loadAutomationJob(id: string) {
  const db = await createServerSupabaseClient();
  const [{ data: job, error }, { data: approvals }, { data: events }, { data: actions }] =
    await Promise.all([
      db.from('crm_automation_jobs_projection').select('*').eq('id', id).maybeSingle(),
      db
        .from('automation_approvals')
        .select('*')
        .eq('job_id', id)
        .order('decided_at', { ascending: false }),
      db
        .from('automation_job_events')
        .select('*')
        .eq('job_id', id)
        .order('occurred_at', { ascending: false }),
      db
        .from('automation_actions')
        .select('*')
        .eq('automation_job_id', id)
        .order('requested_at', { ascending: false }),
    ]);
  return {
    job: unwrap(job, error) as unknown as AutomationRow | null,
    approvals: (approvals ?? []) as unknown as AutomationRow[],
    events: (events ?? []) as unknown as AutomationRow[],
    actions: (actions ?? []) as unknown as AutomationRow[],
  };
}
