import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@zavlio/db/database.types';
import {
  calculateLeadScore,
  scoringModelConfigSchema,
  SERVICE_KEYS,
  type LeadSignal,
  type ServiceKey,
} from './scoring.ts';

type Db = SupabaseClient<Database>;
const relevantEvents = [
  'page_viewed',
  'service_viewed',
  'project_viewed',
  'start_project_opened',
  'project_form_started',
] as const;

function object(value: Json | null): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => JSON.stringify(key) + ':' + stableJson(child))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
function serviceKey(value: unknown): ServiceKey | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase().replace(/[ /-]+/g, '_');
  const aliases: Record<string, ServiceKey> = {
    website: 'web',
    branding: 'brand',
    ai: 'ai_automation',
    automation: 'ai_automation',
  };
  const key = aliases[normalized] ?? normalized;
  return SERVICE_KEYS.includes(key as ServiceKey) ? (key as ServiceKey) : null;
}
function servicesFrom(value: Json | null | undefined): ServiceKey[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return [...new Set(values.map(serviceKey).filter((key): key is ServiceKey => Boolean(key)))];
}
function pathService(path: string | null): ServiceKey | null {
  if (!path) return null;
  const match = path.match(/^\/services\/([^/?#]+)/);
  return match?.[1] ? serviceKey(match[1]) : null;
}

export async function loadActiveScoringModel(db: Db) {
  const result = await db.rpc('get_active_lead_scoring_model');
  if (result.error) throw result.error;
  const model = result.data[0];
  if (!model) throw new Error('No active scoring model');
  return { ...model, config: scoringModelConfigSchema.parse(model.configuration) };
}

export async function extractLeadSignals(
  db: Db,
  requestedPersonId: string,
  asOf: Date,
  modelDb: Db = db,
) {
  const canonical = await db.rpc('resolve_canonical_person_id', { p_person_id: requestedPersonId });
  if (canonical.error || !canonical.data) throw canonical.error ?? new Error('Person not found');
  const personId = canonical.data;
  const model = await loadActiveScoringModel(modelDb);
  const since = new Date(asOf.getTime() - model.config.lookbackDays * 86_400_000).toISOString();
  const [events, sessions, forms] = await Promise.all([
    db
      .from('events')
      .select('id,event_name,page_path,occurred_at,session_id,metadata')
      .eq('person_id', personId)
      .in('event_name', [...relevantEvents])
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: true })
      .limit(2000),
    db
      .from('sessions')
      .select('id,started_at')
      .eq('person_id', personId)
      .gte('started_at', since)
      .order('started_at', { ascending: true })
      .limit(500),
    db
      .from('form_submissions')
      .select('id,form_type,payload,submitted_at')
      .eq('person_id', personId)
      .eq('status', 'PROCESSED')
      .order('submitted_at', { ascending: true })
      .limit(100),
  ]);
  for (const result of [events, sessions, forms]) if (result.error) throw result.error;
  const signals: LeadSignal[] = [];
  const distinctServices = new Set<ServiceKey>();
  const distinctProjects = new Set<string>();
  for (const event of events.data ?? []) {
    const metadata = object(event.metadata);
    let key = event.event_name;
    const affinities: ServiceKey[] = [];
    let entityKey: string | undefined;
    if (event.event_name === 'page_viewed' && event.page_path === '/') key = 'homepage_viewed';
    else if (event.event_name === 'service_viewed') {
      const service = serviceKey(metadata.serviceKey) ?? pathService(event.page_path);
      if (service) {
        affinities.push(service);
        distinctServices.add(service);
        entityKey = service;
      }
    } else if (event.event_name === 'project_viewed') {
      entityKey = String(metadata.projectSlug ?? event.page_path ?? event.id).slice(0, 160);
      distinctProjects.add(entityKey);
      affinities.push(...servicesFrom(metadata.services));
    }
    if (key !== 'page_viewed')
      signals.push({
        key,
        occurredAt: event.occurred_at,
        sourceId: event.id,
        entityKey,
        sessionId: event.session_id ?? undefined,
        affinities,
      });
  }
  if (distinctServices.size >= 2)
    signals.push({
      key: 'second_distinct_service',
      occurredAt: asOf.toISOString(),
      sourceId: 'derived:second-service',
    });
  if (distinctProjects.size >= 2)
    signals.push({
      key: 'multiple_projects',
      occurredAt: asOf.toISOString(),
      sourceId: 'derived:multiple-projects',
    });
  const orderedSessions = sessions.data ?? [];
  for (const session of orderedSessions.slice(1))
    signals.push({
      key: 'return_session',
      occurredAt: session.started_at,
      sourceId: session.id,
      sessionId: session.id,
    });
  if (
    orderedSessions.some(
      (session, index) =>
        index > 0 &&
        new Date(session.started_at).getTime() -
          new Date(orderedSessions[index - 1]!.started_at).getTime() <=
          7 * 86_400_000,
    )
  )
    signals.push({
      key: 'repeat_engagement_7d',
      occurredAt: orderedSessions.at(-1)!.started_at,
      sourceId: 'derived:repeat-7d',
    });
  for (const form of forms.data ?? []) {
    const payload = object(form.payload);
    const affinities = servicesFrom(payload.services);
    const key =
      form.form_type === 'START_A_PROJECT' ? 'project_form_submitted' : 'contact_form_submitted';
    signals.push({
      key,
      occurredAt: form.submitted_at,
      sourceId: form.id,
      entityKey: form.id,
      affinities,
    });
    if (typeof payload.budget === 'string' && payload.budget.trim())
      signals.push({
        key: 'budget_supplied',
        occurredAt: form.submitted_at,
        sourceId: `${form.id}:budget`,
      });
    if (affinities.length >= 2)
      signals.push({
        key: 'high_value_service_combination',
        occurredAt: form.submitted_at,
        sourceId: `${form.id}:combo`,
        affinities,
      });
  }
  return { personId, model, signals };
}

export async function recalculateLeadScore(
  readDb: Db,
  writeDb: Db,
  personId: string,
  options: { asOf?: Date; persist?: boolean; forceSnapshot?: boolean } = {},
) {
  const asOf = options.asOf ?? new Date();
  const extracted = await extractLeadSignals(readDb, personId, asOf, readDb);
  const result = calculateLeadScore(
    { signals: extracted.signals, asOf: asOf.toISOString() },
    extracted.model.config,
  );
  const modelVersion = `${extracted.model.model_key}_V${extracted.model.version}`;
  const serviceInterest = {
    ...result.affinity,
    declared: result.affinity.declared,
    behavioral: result.affinity.behavioral,
  };
  let persisted = false;
  if (options.persist !== false) {
    const latest = await readDb
      .from('lead_scores')
      .select('score,intent_level,service_interest,model_version')
      .eq('person_id', extracted.personId)
      .order('calculated_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest.error) throw latest.error;
    const unchanged =
      latest.data?.score === result.score &&
      latest.data.intent_level === result.intent &&
      latest.data.model_version === modelVersion &&
      stableJson(latest.data.service_interest) === stableJson(serviceInterest);
    if (!unchanged || options.forceSnapshot) {
      const inserted = await writeDb.rpc('persist_lead_score', {
        p_person_id: extracted.personId,
        p_score: result.score,
        p_intent_level: result.intent,
        p_service_interest: serviceInterest as Json,
        p_reasoning: {
          components: result.components,
          signals: result.reasoning,
          asOf: asOf.toISOString(),
          configurationHash: extracted.model.configuration_hash,
        } as Json,
        p_model_version: modelVersion,
        p_calculated_at: asOf.toISOString(),
      });
      if (inserted.error) throw inserted.error;
      persisted = true;
    }
  }
  return { personId: extracted.personId, modelVersion, persisted, ...result };
}
