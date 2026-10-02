import { recalculateLeadScore } from '@zavlio/crm/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey)
  throw new Error('Lead recalculation requires local/server Supabase credentials.');
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const args = process.argv.slice(2);
const value = (name, fallback) =>
  args.includes(name) ? (args[args.indexOf(name) + 1] ?? fallback) : fallback;
const personId = value('--person', null);
const limit = Math.max(1, Math.min(10000, Number(value('--limit', '100')) || 100));
const batchSize = Math.max(1, Math.min(500, Number(value('--batch-size', '50')) || 50));
const dryRun = args.includes('--dry-run');
const staleOnly = args.includes('--stale');
let query = db
  .from('people')
  .select('id')
  .is('merged_into_person_id', null)
  .order('id')
  .limit(limit);
if (personId) query = query.eq('id', personId);
const people = await query;
if (people.error) throw people.error;
let processed = 0;
let persisted = 0;
const started = performance.now();
for (let offset = 0; offset < (people.data?.length ?? 0); offset += batchSize) {
  const batch = people.data.slice(offset, offset + batchSize);
  for (const person of batch) {
    if (staleOnly) {
      const latest = await db
        .from('crm_current_lead_score')
        .select('is_stale')
        .eq('person_id', person.id)
        .maybeSingle();
      if (latest.data && !latest.data.is_stale) continue;
    }
    const result = await recalculateLeadScore(db, db, person.id, { persist: !dryRun });
    processed += 1;
    if (result.persisted) persisted += 1;
    if (personId || dryRun)
      console.log(
        JSON.stringify({
          personId: person.id,
          score: result.score,
          intent: result.intent,
          primary: result.affinity.primary,
          persisted: result.persisted,
        }),
      );
  }
}
console.log(
  JSON.stringify({
    processed,
    persisted,
    dryRun,
    elapsedMs: Number((performance.now() - started).toFixed(2)),
  }),
);
