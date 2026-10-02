import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const migrationDir = path.join(root, 'supabase', 'migrations');
const requiredTables = [
  'staff_profiles',
  'authors',
  'testimonials',
  'services',
  'projects',
  'project_media',
  'lab_projects',
  'insights',
  'site_settings',
  'navigation_items',
  'footer_links',
  'reusable_content_blocks',
  'organizations',
  'people',
  'anonymous_visitors',
  'sessions',
  'identities',
  'identity_match_candidates',
  'consents',
  'events',
  'form_submissions',
  'lead_scores',
  'pipeline_stages',
  'opportunities',
  'opportunity_stage_history',
  'tasks',
  'notes',
  'touchpoints',
  'conversations',
  'messages',
  'campaigns',
  'campaign_members',
  'automation_agents',
  'automation_settings',
  'automation_jobs',
  'automation_runs',
  'automation_actions',
  'automation_nonces',
  'audit_logs',
];

async function allMigrations() {
  const entries = await (await import('node:fs/promises')).readdir(migrationDir);
  return Promise.all(
    entries
      .filter((entry) => entry.endsWith('.sql'))
      .sort()
      .map((entry) => readFile(path.join(migrationDir, entry), 'utf8')),
  );
}

describe('Packet 06 database contract', () => {
  it('contains the complete relational foundation and ordered migrations', async () => {
    const sql = (await allMigrations()).join('\n');
    for (const table of requiredTables) expect(sql).toContain(`create table public.${table}`);
    expect(sql).toContain('alter table public.%I enable row level security');
    expect(sql).toContain("'organizations','people','anonymous_visitors'");
    expect(sql).toContain('revoke all on all tables in schema public from anon, authenticated');
  });

  it('keeps database invariants in relational constraints', async () => {
    const sql = (await allMigrations()).join('\n');
    expect(sql).toContain('score integer not null check (score between 0 and 100)');
    expect(sql).toContain('probability numeric(5,2) check');
    expect(sql).toContain('person_a <> person_b');
    expect(sql).toContain('idempotency_key text not null unique');
    expect(sql).not.toMatch(/\bdouble precision\b|\breal\b|\bfloat\b/i);
  });
});
