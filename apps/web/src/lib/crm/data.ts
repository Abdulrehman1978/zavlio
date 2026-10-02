import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

export const CRM_PAGE_SIZE = 25;
export const CRM_MAX_PAGE_SIZE = 50;
export const PEOPLE_SORTS = ['last_activity', 'created', 'name', 'score'] as const;
export type PeopleSort = (typeof PEOPLE_SORTS)[number];
export const TIMELINE_CATEGORIES = [
  'ALL',
  'WEBSITE',
  'ENQUIRY',
  'CRM',
  'EMAIL',
  'CONVERSATION',
  'OPPORTUNITY',
  'TASK',
  'CONSENT',
  'IDENTITY',
  'NOTE',
] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];
type CrmClient = SupabaseClient<Database>;
type Projection = Database['public']['Views']['crm_people_projection']['Row'];
export type PersonListRow = Projection & { latest_interest: string | null };
export type TimelineItem =
  Database['public']['Functions']['crm_person_timeline']['Returns'][number];

function cleanSearch(value: string | undefined): string | undefined {
  const normalized = value?.trim().slice(0, 80);
  return normalized ? normalized.replace(/[%,_\\]/g, (character) => `\\${character}`) : undefined;
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) ? Math.max(1, Math.min(page, 200)) : 1;
}

export type PeopleQuery = {
  search?: string;
  lifecycle?: string;
  intent?: string;
  source?: string;
  dnc?: 'all' | 'yes' | 'no';
  organization?: string;
  sort?: PeopleSort;
  page?: number;
};

export function parsePeopleQuery(params: URLSearchParams): PeopleQuery {
  const sort = PEOPLE_SORTS.includes(params.get('sort') as PeopleSort)
    ? (params.get('sort') as PeopleSort)
    : 'last_activity';
  const dnc = ['all', 'yes', 'no'].includes(params.get('dnc') ?? '')
    ? (params.get('dnc') as 'all' | 'yes' | 'no')
    : 'all';
  return {
    search: cleanSearch(params.get('q') ?? undefined),
    lifecycle: params.get('lifecycle')?.slice(0, 32) || undefined,
    intent: params.get('intent')?.slice(0, 32) || undefined,
    source: params.get('source')?.slice(0, 80) || undefined,
    dnc,
    organization: params.get('organization')?.slice(0, 80) || undefined,
    sort,
    page: parsePage(params.get('page') ?? undefined),
  };
}

async function searchPersonIds(db: CrmClient, search: string): Promise<string[] | null> {
  const pattern = `%${search}%`;
  const [direct, organizations, identities] = await Promise.all([
    db
      .from('people')
      .select('id')
      .or(`display_name.ilike.${pattern},primary_email.ilike.${pattern}`)
      .limit(500),
    db
      .from('organizations')
      .select('id')
      .or(`name.ilike.${pattern},domain.ilike.${pattern},website.ilike.${pattern}`)
      .limit(200),
    db
      .from('identities')
      .select('person_id')
      .or(`username.ilike.${pattern},email.ilike.${pattern},provider.ilike.${pattern}`)
      .limit(500),
  ]);
  if (direct.error) throw direct.error;
  if (organizations.error) throw organizations.error;
  if (identities.error) throw identities.error;
  const organizationIds = organizations.data.map((row) => row.id);
  const organizationPeople = organizationIds.length
    ? await db.from('people').select('id').in('organization_id', organizationIds).limit(500)
    : { data: [], error: null };
  if (organizationPeople.error) throw organizationPeople.error;
  return [
    ...new Set([
      ...direct.data.map((row) => row.id),
      ...organizationPeople.data.map((row) => row.id),
      ...identities.data.map((row) => row.person_id),
    ]),
  ];
}

export async function listPeople(db: CrmClient, query: PeopleQuery) {
  const page = query.page ?? 1;
  const searchIds = query.search ? await searchPersonIds(db, query.search) : null;
  let request = db
    .from('crm_people_projection')
    .select('*', { count: 'exact' })
    .is('merged_into_person_id', null)
    .range((page - 1) * CRM_PAGE_SIZE, page * CRM_PAGE_SIZE - 1);
  if (searchIds) {
    if (!searchIds.length)
      return { rows: [], count: 0, page, pageSize: CRM_PAGE_SIZE, pageCount: 0 };
    request = request.in('id', searchIds);
  }
  if (query.lifecycle) request = request.eq('lifecycle_stage', query.lifecycle);
  if (query.source) request = request.ilike('lead_source', `%${query.source}%`);
  if (query.organization) request = request.ilike('organization_name', `%${query.organization}%`);
  if (query.dnc === 'yes') request = request.eq('do_not_contact', true);
  if (query.dnc === 'no') request = request.eq('do_not_contact', false);
  if (query.intent) request = request.eq('latest_intent', query.intent);
  const sortColumn =
    query.sort === 'created'
      ? 'created_at'
      : query.sort === 'name'
        ? 'display_name'
        : query.sort === 'score'
          ? 'latest_score'
          : 'last_activity_at';
  request = request
    .order(sortColumn, { ascending: query.sort === 'name', nullsFirst: false })
    .order('id', { ascending: false });
  const result = await request;
  if (result.error) throw result.error;
  const count = result.count ?? 0;
  return {
    rows: (result.data ?? []).map((row) => ({
      ...row,
      latest_interest: row.latest_primary_interest ?? null,
    })),
    count,
    page,
    pageSize: CRM_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(count / CRM_PAGE_SIZE)),
  };
}

export async function getPersonDetail(db: CrmClient, personId: string) {
  const [
    person,
    identities,
    consents,
    forms,
    opportunities,
    tasks,
    notes,
    conversations,
    messages,
    visitors,
    scores,
    merges,
  ] = await Promise.all([
    db.from('crm_people_projection').select('*').eq('id', personId).maybeSingle(),
    db
      .from('identities')
      .select(
        'id,provider,provider_user_id,username,profile_url,email,verified,confidence,source,discovered_at,last_seen_at',
      )
      .eq('person_id', personId)
      .order('discovered_at', { ascending: false })
      .limit(100),
    db
      .from('consents')
      .select(
        'id,analytics,marketing_email,marketing_social,personalization,policy_version,captured_at,withdrawn_at,source',
      )
      .eq('person_id', personId)
      .order('captured_at', { ascending: false })
      .limit(100),
    db
      .from('form_submissions')
      .select(
        'id,form_type,schema_version,payload,status,source,submitted_at,conflict_detected,opportunity_id,task_id',
      )
      .eq('person_id', personId)
      .order('submitted_at', { ascending: false })
      .limit(50),
    db
      .from('opportunities')
      .select(
        'id,title,estimated_value,currency,probability,source,expected_close_date,created_at,stage_id,owner_id,pipeline_stages(name,slug)',
      )
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('tasks')
      .select('id,title,status,priority,due_at,created_at,assigned_to,opportunity_id')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('notes')
      .select('id,body,visibility,created_at,updated_at,author_id,staff_profiles(name)')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('conversations')
      .select('id,channel,status,last_message_at,created_at')
      .eq('person_id', personId)
      .order('last_message_at', { ascending: false })
      .limit(50),
    db
      .from('messages')
      .select('id,conversation_id,channel,direction,body,status,sent_at,received_at,created_at')
      .eq('person_id', personId)
      .order('created_at', { ascending: true })
      .limit(100),
    db
      .from('anonymous_visitors')
      .select('id,visitor_key,first_seen_at,last_seen_at,first_source,last_source,session_count')
      .eq('linked_person_id', personId)
      .order('last_seen_at', { ascending: false })
      .limit(20),
    db
      .from('lead_scores')
      .select('id,score,intent_level,service_interest,reasoning,model_version,calculated_at')
      .eq('person_id', personId)
      .order('calculated_at', { ascending: false })
      .limit(20),
    db
      .from('person_merges')
      .select(
        'id,source_person_id,target_person_id,merged_by,candidate_id,reason,summary,merged_at',
      )
      .or(`source_person_id.eq.${personId},target_person_id.eq.${personId}`)
      .order('merged_at', { ascending: false })
      .limit(20),
  ]);
  for (const result of [
    person,
    identities,
    consents,
    forms,
    opportunities,
    tasks,
    notes,
    conversations,
    messages,
    visitors,
    scores,
    merges,
  ])
    if (result.error) throw result.error;
  if (!person.data) return null;
  return {
    person: person.data,
    canonicalId: person.data.merged_into_person_id,
    identities: identities.data ?? [],
    consents: consents.data ?? [],
    forms: forms.data ?? [],
    opportunities: opportunities.data ?? [],
    tasks: tasks.data ?? [],
    notes: notes.data ?? [],
    conversations: conversations.data ?? [],
    messages: messages.data ?? [],
    visitors: visitors.data ?? [],
    scores: scores.data ?? [],
    merges: merges.data ?? [],
  };
}

export async function listConversations(db: CrmClient, search?: string) {
  const conversations = await db
    .from('conversations')
    .select('id,person_id,channel,external_thread_id,status,last_message_at,created_at')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (conversations.error) throw conversations.error;
  const rows = conversations.data ?? [];
  const personIds = [...new Set(rows.map((row) => row.person_id).filter(Boolean))];
  const people = personIds.length
    ? await db
        .from('crm_people_projection')
        .select('id,display_name,do_not_contact,organization_name')
        .in('id', personIds)
    : { data: [], error: null };
  if (people.error) throw people.error;
  const byId = new Map((people.data ?? []).map((person) => [person.id, person]));
  const normalized = search?.trim().toLocaleLowerCase('en-US');
  return rows
    .map((conversation) => ({
      ...conversation,
      person: conversation.person_id ? (byId.get(conversation.person_id) ?? null) : null,
    }))
    .filter((conversation) => {
      if (!normalized) return true;
      return (
        conversation.channel.toLocaleLowerCase('en-US').includes(normalized) ||
        conversation.external_thread_id?.toLocaleLowerCase('en-US').includes(normalized) ||
        conversation.person?.display_name?.toLocaleLowerCase('en-US').includes(normalized)
      );
    });
}

export async function getConversationDetail(db: CrmClient, conversationId: string) {
  const conversation = await db
    .from('conversations')
    .select('id,person_id,channel,external_thread_id,status,last_message_at,created_at')
    .eq('id', conversationId)
    .maybeSingle();
  if (conversation.error) throw conversation.error;
  if (!conversation.data) return null;
  const [messages, person, identities, consents] = await Promise.all([
    db
      .from('messages')
      .select(
        'id,conversation_id,person_id,channel,direction,body,status,sent_at,received_at,created_at',
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100),
    conversation.data.person_id
      ? db
          .from('crm_people_projection')
          .select('id,display_name,do_not_contact,organization_name')
          .eq('id', conversation.data.person_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    conversation.data.person_id
      ? db
          .from('identities')
          .select('id,provider,provider_user_id,username,profile_url,verified,confidence')
          .eq('person_id', conversation.data.person_id)
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    conversation.data.person_id
      ? db
          .from('consents')
          .select('marketing_social,policy_version,captured_at,withdrawn_at')
          .eq('person_id', conversation.data.person_id)
          .order('captured_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [messages, person, identities, consents])
    if (result.error) throw result.error;
  return {
    conversation: conversation.data,
    messages: messages.data ?? [],
    person: person.data,
    identities: identities.data ?? [],
    consent: consents.data?.[0] ?? null,
  };
}

export async function getTimeline(
  db: CrmClient,
  personId: string,
  category: TimelineCategory = 'ALL',
  beforeAt?: string,
  beforeId?: string,
) {
  const result = await db.rpc('crm_person_timeline', {
    p_person_id: personId,
    p_category: category,
    p_before_at: beforeAt,
    p_before_id: beforeId,
    p_limit: 50,
  });
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function listOrganizations(db: CrmClient, search?: string, page = 1) {
  let request = db
    .from('organizations')
    .select('id,name,domain,website,industry,country,size_range,notes,created_at,updated_at', {
      count: 'exact',
    })
    .order('name', { ascending: true })
    .range((page - 1) * CRM_PAGE_SIZE, page * CRM_PAGE_SIZE - 1);
  const safe = cleanSearch(search);
  if (safe)
    request = request.or(`name.ilike.%${safe}%,domain.ilike.%${safe}%,website.ilike.%${safe}%`);
  const result = await request;
  if (result.error) throw result.error;
  const rows = result.data ?? [];
  const ids = rows.map((row) => row.id);
  const people = ids.length
    ? await db
        .from('people')
        .select('id,organization_id')
        .in('organization_id', ids)
        .is('merged_into_person_id', null)
    : { data: [], error: null };
  if (people.error) throw people.error;
  const peopleCounts = new Map<string, number>();
  for (const row of people.data)
    peopleCounts.set(
      row.organization_id ?? '',
      (peopleCounts.get(row.organization_id ?? '') ?? 0) + 1,
    );
  return {
    rows: rows.map((row) => ({ ...row, people_count: peopleCounts.get(row.id) ?? 0 })),
    count: result.count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((result.count ?? 0) / CRM_PAGE_SIZE)),
  };
}

export async function getOrganizationDetail(db: CrmClient, organizationId: string) {
  const [organization, people, opportunities, notes] = await Promise.all([
    db
      .from('organizations')
      .select('id,name,domain,website,industry,country,size_range,notes,created_at,updated_at')
      .eq('id', organizationId)
      .maybeSingle(),
    db
      .from('crm_people_projection')
      .select(
        'id,display_name,primary_email,job_title,lifecycle_stage,do_not_contact,last_activity_at',
      )
      .eq('organization_id', organizationId)
      .is('merged_into_person_id', null)
      .order('last_activity_at', { ascending: false, nullsFirst: false })
      .limit(100),
    db
      .from('opportunities')
      .select(
        'id,title,estimated_value,currency,expected_close_date,created_at,person_id,pipeline_stages(name,slug)',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('notes')
      .select('id,body,visibility,created_at,updated_at,person_id,author_id,staff_profiles(name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  for (const result of [organization, people, opportunities, notes])
    if (result.error) throw result.error;
  if (!organization.data) return null;
  return {
    organization: organization.data,
    people: people.data ?? [],
    opportunities: opportunities.data ?? [],
    notes: notes.data ?? [],
  };
}

export async function listIdentityCandidates(db: CrmClient, status = 'PENDING', page = 1) {
  const result = await db
    .from('identity_match_candidates')
    .select('id,person_a,person_b,confidence,match_reasons,status,reviewed_at,created_at', {
      count: 'exact',
    })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range((page - 1) * CRM_PAGE_SIZE, page * CRM_PAGE_SIZE - 1);
  if (result.error) throw result.error;
  const ids = [...new Set((result.data ?? []).flatMap((row) => [row.person_a, row.person_b]))];
  const people = ids.length
    ? await db
        .from('crm_people_projection')
        .select('id,display_name,primary_email,organization_name,lifecycle_stage,do_not_contact')
        .in('id', ids)
    : { data: [], error: null };
  if (people.error) throw people.error;
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return {
    rows: (result.data ?? []).map((row) => ({
      ...row,
      personA: byId.get(row.person_a),
      personB: byId.get(row.person_b),
    })),
    count: result.count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((result.count ?? 0) / CRM_PAGE_SIZE)),
  };
}

export type PipelineQuery = {
  q?: string;
  stage?: string;
  owner?: string;
  intent?: string;
  service?: string;
  closed?: boolean;
  view?: 'kanban' | 'table';
  page: number;
};

export function parsePipelineQuery(params: URLSearchParams): PipelineQuery {
  return {
    q: cleanSearch(params.get('q') ?? undefined),
    stage: params.get('stage')?.slice(0, 80) || undefined,
    owner: params.get('owner')?.slice(0, 80) || undefined,
    intent: params.get('intent')?.slice(0, 32) || undefined,
    service: params.get('service')?.slice(0, 80) || undefined,
    closed: params.get('closed') === 'yes',
    view: params.get('view') === 'table' ? 'table' : 'kanban',
    page: parsePage(params.get('page') ?? undefined),
  };
}

export async function listPipeline(db: CrmClient, query: PipelineQuery) {
  let request = db
    .from('crm_pipeline_projection')
    .select('*', { count: 'exact' })
    .order('stage_sort_order')
    .order('updated_at', { ascending: false })
    .range((query.page - 1) * CRM_PAGE_SIZE, query.page * CRM_PAGE_SIZE - 1);
  if (!query.closed) request = request.eq('is_closed', false);
  if (query.stage) request = request.eq('stage_slug', query.stage);
  if (query.owner === 'unassigned') request = request.is('owner_id', null);
  else if (query.owner) request = request.eq('owner_id', query.owner);
  if (query.intent) request = request.eq('intent_level', query.intent);
  if (query.service) request = request.eq('primary_interest', query.service);
  if (query.q)
    request = request.or(
      `title.ilike.%${query.q}%,person_name.ilike.%${query.q}%,organization_name.ilike.%${query.q}%,primary_email.ilike.%${query.q}%`,
    );
  const [result, stages] = await Promise.all([
    request,
    db
      .from('pipeline_stages')
      .select('id,name,slug,sort_order,is_closed,is_won')
      .order('sort_order'),
  ]);
  if (result.error) throw result.error;
  if (stages.error) throw stages.error;
  return {
    rows: result.data ?? [],
    stages: stages.data ?? [],
    count: result.count ?? 0,
    page: query.page,
    pageCount: Math.max(1, Math.ceil((result.count ?? 0) / CRM_PAGE_SIZE)),
  };
}

export async function getOpportunityDetail(db: CrmClient, id: string) {
  const [opportunity, history, tasks, stages, staff] = await Promise.all([
    db.from('crm_pipeline_projection').select('*').eq('id', id).maybeSingle(),
    db
      .from('opportunity_stage_history')
      .select('id,from_stage_id,to_stage_id,changed_by,changed_at,reason,metadata')
      .eq('opportunity_id', id)
      .order('changed_at', { ascending: false })
      .limit(100),
    db
      .from('crm_task_projection')
      .select('*')
      .eq('opportunity_id', id)
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    db
      .from('pipeline_stages')
      .select('id,name,slug,sort_order,is_closed,is_won')
      .order('sort_order'),
    db
      .from('staff_profiles')
      .select('id,name,role,active')
      .eq('active', true)
      .in('role', ['OWNER', 'ADMIN', 'OPERATOR'])
      .order('name'),
  ]);
  for (const result of [opportunity, history, tasks, stages, staff])
    if (result.error) throw result.error;
  if (!opportunity.data) return null;
  const stageNames = new Map((stages.data ?? []).map((stage) => [stage.id, stage.name]));
  const staffNames = new Map((staff.data ?? []).map((member) => [member.id, member.name]));
  return {
    opportunity: opportunity.data,
    history: (history.data ?? []).map((item) => ({
      ...item,
      fromStage: item.from_stage_id ? stageNames.get(item.from_stage_id) : null,
      toStage: stageNames.get(item.to_stage_id) ?? 'Unknown',
      actor: item.changed_by ? staffNames.get(item.changed_by) : null,
    })),
    tasks: tasks.data ?? [],
    stages: stages.data ?? [],
    staff: staff.data ?? [],
  };
}

export type TaskQuery = {
  scope: 'mine' | 'all' | 'overdue' | 'today' | 'upcoming' | 'completed' | 'unassigned';
  priority?: string;
  page: number;
};
export function parseTaskQuery(params: URLSearchParams): TaskQuery {
  const scope = ['mine', 'all', 'overdue', 'today', 'upcoming', 'completed', 'unassigned'].includes(
    params.get('scope') ?? '',
  )
    ? (params.get('scope') as TaskQuery['scope'])
    : 'mine';
  return {
    scope,
    priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(params.get('priority') ?? '')
      ? (params.get('priority') ?? undefined)
      : undefined,
    page: parsePage(params.get('page') ?? undefined),
  };
}

export async function listTasks(db: CrmClient, query: TaskQuery, staffId: string) {
  const now = new Date();
  const kolkataOffsetMs = 330 * 60_000;
  const kolkataNow = new Date(now.getTime() + kolkataOffsetMs);
  const start = new Date(
    Date.UTC(kolkataNow.getUTCFullYear(), kolkataNow.getUTCMonth(), kolkataNow.getUTCDate()) -
      kolkataOffsetMs,
  );
  const tomorrow = new Date(start.getTime() + 86_400_000);
  let request = db
    .from('crm_task_projection')
    .select('*', { count: 'exact' })
    .order('due_at', { ascending: true, nullsFirst: false })
    .range((query.page - 1) * CRM_PAGE_SIZE, query.page * CRM_PAGE_SIZE - 1);
  if (query.scope === 'mine')
    request = request.eq('assigned_to', staffId).in('status', ['OPEN', 'IN_PROGRESS']);
  if (query.scope === 'overdue') request = request.eq('is_overdue', true);
  if (query.scope === 'today')
    request = request
      .gte('due_at', start.toISOString())
      .lt('due_at', tomorrow.toISOString())
      .in('status', ['OPEN', 'IN_PROGRESS']);
  if (query.scope === 'upcoming')
    request = request.gte('due_at', tomorrow.toISOString()).in('status', ['OPEN', 'IN_PROGRESS']);
  if (query.scope === 'completed') request = request.eq('status', 'COMPLETED');
  if (query.scope === 'unassigned')
    request = request.is('assigned_to', null).in('status', ['OPEN', 'IN_PROGRESS']);
  if (query.priority) request = request.eq('priority', query.priority);
  const result = await request;
  if (result.error) throw result.error;
  return {
    rows: result.data ?? [],
    count: result.count ?? 0,
    page: query.page,
    pageCount: Math.max(1, Math.ceil((result.count ?? 0) / CRM_PAGE_SIZE)),
  };
}
