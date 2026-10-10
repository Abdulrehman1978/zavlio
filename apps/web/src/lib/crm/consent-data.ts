import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

export interface ConsentRecordRow {
  id: string;
  person_id: string | null;
  visitor_id: string | null;
  person_name?: string | null;
  analytics: boolean;
  marketing_email: boolean;
  marketing_social: boolean;
  personalization: boolean;
  policy_version: string;
  captured_at: string;
  withdrawn_at: string | null;
  source: string;
}

export interface DncPersonRow {
  id: string;
  display_name: string;
  primary_email: string | null;
  lifecycle_stage: string;
  do_not_contact: boolean;
  updated_at: string;
}

export async function listConsents(
  db: SupabaseClient<Database>,
  search?: string,
): Promise<{ count: number; rows: ConsentRecordRow[] }> {
  let query = db
    .from('consents')
    .select(
      `
      id,
      person_id,
      visitor_id,
      analytics,
      marketing_email,
      marketing_social,
      personalization,
      policy_version,
      captured_at,
      withdrawn_at,
      source,
      people(display_name)
    `,
      { count: 'exact' },
    )
    .order('captured_at', { ascending: false })
    .limit(100);

  if (search && search.trim().length > 0) {
    query = query.or(`source.ilike.%${search.trim()}%,policy_version.ilike.%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: ConsentRecordRow[] = (data || []).map((row) => {
    const p = row.people as unknown as { display_name?: string } | null;
    return {
      id: row.id,
      person_id: row.person_id,
      visitor_id: row.visitor_id,
      person_name: p?.display_name || null,
      analytics: row.analytics,
      marketing_email: row.marketing_email,
      marketing_social: row.marketing_social,
      personalization: row.personalization,
      policy_version: row.policy_version,
      captured_at: row.captured_at,
      withdrawn_at: row.withdrawn_at,
      source: row.source,
    };
  });

  return {
    count: count ?? rows.length,
    rows,
  };
}

export async function listDncPeople(db: SupabaseClient<Database>): Promise<DncPersonRow[]> {
  const { data, error } = await db
    .from('people')
    .select('id, display_name, primary_email, lifecycle_stage, do_not_contact, updated_at')
    .eq('do_not_contact', true)
    .is('merged_into_person_id', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function generateSubjectExport(db: SupabaseClient<Database>, personId: string) {
  // Resolve canonical person
  const canonical = await db.rpc('resolve_canonical_person_id', { p_person_id: personId });
  const effectiveId = canonical.data || personId;

  const [personRes, identitiesRes, consentsRes, formsRes, eventsRes] = await Promise.all([
    db.from('people').select('*').eq('id', effectiveId).single(),
    db
      .from('identities')
      .select('provider, username, profile_url, verified, discovered_at')
      .eq('person_id', effectiveId),
    db.from('consents').select('*').eq('person_id', effectiveId),
    db
      .from('form_submissions')
      .select('id, form_type, payload, submitted_at, source')
      .eq('person_id', effectiveId),
    db
      .from('events')
      .select('id, event_name, page_path, occurred_at')
      .eq('person_id', effectiveId)
      .limit(500),
  ]);

  if (personRes.error || !personRes.data) {
    throw new Error('Person record not found');
  }

  const p = personRes.data;

  return {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      subjectPersonId: effectiveId,
      purpose: 'DATA_SUBJECT_ACCESS_REQUEST',
      complianceNotice:
        'Structured, bounded export. System credentials and machine internals redacted.',
    },
    profile: {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      displayName: p.display_name,
      primaryEmail: p.primary_email,
      primaryPhone: p.primary_phone,
      jobTitle: p.job_title,
      doNotContact: p.do_not_contact,
      lifecycleStage: p.lifecycle_stage,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    },
    identities: identitiesRes.data || [],
    consentHistory: consentsRes.data || [],
    formSubmissions: formsRes.data || [],
    recordedEventsCount: (eventsRes.data || []).length,
    recordedEventsSample: (eventsRes.data || []).slice(0, 50),
  };
}

export async function generateAnonymizePreview(db: SupabaseClient<Database>, personId: string) {
  const canonical = await db.rpc('resolve_canonical_person_id', { p_person_id: personId });
  const effectiveId = canonical.data || personId;

  const [personRes, identitiesRes, submissionsRes, eventsRes, tasksRes, notesRes] =
    await Promise.all([
      db
        .from('people')
        .select('id, display_name, primary_email, do_not_contact')
        .eq('id', effectiveId)
        .single(),
      db
        .from('identities')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', effectiveId),
      db
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', effectiveId),
      db.from('events').select('id', { count: 'exact', head: true }).eq('person_id', effectiveId),
      db.from('tasks').select('id', { count: 'exact', head: true }).eq('person_id', effectiveId),
      db.from('notes').select('id', { count: 'exact', head: true }).eq('person_id', effectiveId),
    ]);

  if (!personRes.data) throw new Error('Person not found');

  return {
    personId: effectiveId,
    displayName: personRes.data.display_name,
    primaryEmail: personRes.data.primary_email,
    doNotContact: personRes.data.do_not_contact,
    scopeToAnonymize: {
      profileAttributes: [
        'first_name',
        'last_name',
        'display_name',
        'primary_email',
        'primary_phone',
        'job_title',
      ],
      identitiesCount: identitiesRes.count ?? 0,
      formSubmissionsCount: submissionsRes.count ?? 0,
      eventsCount: eventsRes.count ?? 0,
      tasksCount: tasksRes.count ?? 0,
      notesCount: notesRes.count ?? 0,
    },
    complianceSafeguards: {
      dncSuppressionPreserved: true,
      auditHistoryPreserved: true,
      executionStatus: 'DRY_RUN_PREVIEW_ONLY',
      notice:
        'Destructive purge is held in PENDING_POLICY_APPROVAL until formal legal retention policy sign-off.',
    },
  };
}
