import 'server-only';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { createEmailProvider, EmailDeliveryError, type EmailProvider } from '@zavlio/email';
import {
  deriveDisplayName,
  isFreeEmailDomain,
  normalizeWebsiteDomain,
  SERVICE_LABELS,
  type ContactPayload,
  type StartProjectPayload,
} from '@zavlio/validation';
import { normalizeSource } from '@zavlio/analytics';
import { createLogger } from '@zavlio/config';
import { serverEnv } from '../env/server';

const logger = createLogger('lead-intake');
const POLICY_VERSION = 'PACKET_09_INTAKE_V1';
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type IntakePayload = StartProjectPayload | ContactPayload;
type IntakeResult = {
  submissionId: string;
  personId: string;
  opportunityId: string | null;
  taskId: string | null;
  touchpointId: string;
  leadScoreId: string | null;
  conflictDetected: boolean;
  duplicate: boolean;
};

function isStart(payload: IntakePayload): payload is StartProjectPayload {
  return payload.formVersion === 'START_PROJECT_V1';
}

function scoreIntake(payload: IntakePayload, returnSession: boolean) {
  const signals: Array<{ type: string; points: number }> = [];
  signals.push({
    type: isStart(payload) ? 'project_form_submitted' : 'contact_form_submitted',
    points: isStart(payload) ? 40 : 20,
  });
  if (isStart(payload)) {
    if (!['EXPLORING', 'DISCUSS'].includes(payload.budget))
      signals.push({ type: 'budget_provided', points: 20 });
    if (payload.services.length)
      signals.push({
        type: 'declared_service_selection',
        points: Math.min(15, payload.services.length * 5),
      });
  }
  if (returnSession) signals.push({ type: 'return_session', points: 8 });
  const score = Math.min(
    100,
    signals.reduce((sum, signal) => sum + signal.points, 0),
  );
  const intentLevel =
    score >= 80
      ? 'PRIORITY'
      : score >= 60
        ? 'HIGH'
        : score >= 40
          ? 'WARM'
          : score >= 20
            ? 'INTERESTED'
            : 'LOW';
  return { score, intentLevel, reasoning: { modelVersion: POLICY_VERSION, signals } };
}

function serviceInterest(payload: IntakePayload) {
  return isStart(payload)
    ? {
        kind: 'DECLARED',
        services: payload.services,
        budget: payload.budget,
        timing: payload.timing,
        selfReportedSource: payload.source,
      }
    : { kind: 'DECLARED', services: ['unspecified'], selfReportedSource: undefined };
}

function shortSummary(payload: IntakePayload): string {
  if (isStart(payload))
    return `${payload.services.map((service) => SERVICE_LABELS[service]).join(', ')} enquiry`;
  return 'Website contact enquiry';
}

function titleFor(payload: IntakePayload): string {
  if (!isStart(payload)) return `Contact enquiry — ${payload.company ?? payload.name}`;
  const services = payload.services
    .filter((service) => service !== 'unspecified')
    .slice(0, 3)
    .map((service) => SERVICE_LABELS[service]);
  return `${services.length ? services.join(' + ') : 'Project'} — ${payload.company ?? payload.name}`.slice(
    0,
    200,
  );
}

function recipients(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes('@'))
    .slice(0, 10);
}

function emailJobs(payload: IntakePayload, submissionKey: string) {
  const internalPayload = isStart(payload)
    ? {
        name: payload.name,
        email: payload.email,
        company: payload.company,
        services: payload.services,
        budget: payload.budget,
        timing: payload.timing,
        goal: payload.goal.slice(0, 500),
      }
    : {
        name: payload.name,
        email: payload.email,
        company: payload.company,
        message: payload.message.slice(0, 500),
      };
  const jobs: Array<{
    template: string;
    recipient: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
  }> = [];
  jobs.push({
    template: 'LEAD_CONFIRMATION_V1',
    recipient: payload.email,
    payload: { name: payload.name, formType: isStart(payload) ? 'START_A_PROJECT' : 'CONTACT' },
    idempotencyKey: `${submissionKey}:confirmation`,
  });
  for (const recipient of recipients(serverEnv.LEAD_NOTIFICATION_RECIPIENTS))
    jobs.push({
      template: 'LEAD_INTERNAL_NOTIFICATION_V1',
      recipient,
      payload: internalPayload,
      idempotencyKey: `${submissionKey}:internal:${recipient}`,
    });
  return jobs;
}

async function resolveAnalyticsVisitor(
  visitorKey: string | undefined,
  consentCookie: string | undefined,
) {
  if (!visitorKey || !consentCookie) return { visitorKey: undefined, linkAnalytics: false };
  const [state, consentKey, policy] = consentCookie.split('|');
  if (state !== 'analytics_allowed' || !consentKey || policy !== '2026-09-v1')
    return { visitorKey: undefined, linkAnalytics: false };
  const db = createAdminDatabaseClient();
  const { data } = await db
    .from('consents')
    .select('analytics,policy_version')
    .eq('consent_key', consentKey)
    .maybeSingle();
  return data?.analytics && data.policy_version === policy
    ? { visitorKey, linkAnalytics: true }
    : { visitorKey: undefined, linkAnalytics: false };
}

export async function intakeLeadSubmission(options: {
  payload: IntakePayload;
  visitorCookie?: string;
  consentCookie?: string;
  referer?: string;
}): Promise<IntakeResult> {
  const db = createAdminDatabaseClient();
  const analytics = await resolveAnalyticsVisitor(options.visitorCookie, options.consentCookie);
  let returnSession = false;
  if (analytics.visitorKey) {
    const visitor = await db
      .from('anonymous_visitors')
      .select('id')
      .eq('visitor_key', analytics.visitorKey)
      .maybeSingle();
    if (visitor.data) {
      const sessions = await db
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('visitor_id', visitor.data.id);
      returnSession = (sessions.count ?? 0) > 1;
    }
  }
  const score = scoreIntake(options.payload, returnSession);
  const derived = deriveDisplayName(options.payload.name);
  const websiteDomain = normalizeWebsiteDomain(options.payload.website);
  const emailDomain = options.payload.email.split('@')[1]?.toLowerCase();
  const organizationDomain =
    websiteDomain && (!emailDomain || !isFreeEmailDomain(options.payload.email))
      ? websiteDomain
      : websiteDomain;
  const startPayload = isStart(options.payload) ? options.payload : undefined;
  const start = Boolean(startPayload);
  const response = await db.rpc('intake_lead_submission', {
    p_idempotency_key: options.payload.idempotencyKey,
    p_form_type: start ? 'START_A_PROJECT' : 'CONTACT',
    p_schema_version: options.payload.formVersion,
    p_payload: options.payload as unknown as Json,
    p_name: derived.displayName,
    p_email: options.payload.email,
    p_company: options.payload.company ?? '',
    p_website: options.payload.website ?? '',
    p_company_domain: organizationDomain ?? '',
    p_role: options.payload.role ?? '',
    p_service_interests: serviceInterest(options.payload),
    p_budget_key: startPayload?.budget ?? '',
    p_timing_key: startPayload?.timing ?? '',
    p_self_reported_source: startPayload?.source ?? '',
    p_system_source: normalizeSource(undefined, options.referer),
    p_visitor_key: (analytics.visitorKey ?? null) as unknown as string,
    p_link_analytics: analytics.linkAnalytics,
    p_create_opportunity: start,
    p_opportunity_title: titleFor(options.payload),
    p_touchpoint_type: start ? 'PROJECT_ENQUIRY' : 'CONTACT_ENQUIRY',
    p_touchpoint_summary: shortSummary(options.payload),
    p_task_title: `${start ? 'Review project' : 'Review contact'} enquiry from ${options.payload.name}`,
    p_task_priority: start ? 'HIGH' : 'NORMAL',
    p_due_at: new Date(Date.now() + serverEnv.LEAD_TASK_SLA_HOURS * 60 * 60 * 1000).toISOString(),
    p_score: score.score,
    p_score_intent: score.intentLevel,
    p_score_reasoning: score.reasoning,
    p_email_jobs: emailJobs(options.payload, options.payload.idempotencyKey) as unknown as Json,
  });
  if (response.error || !response.data?.[0]) {
    logger.log('error', 'FORM_TRANSACTION_FAILED', {
      code: response.error?.code ?? 'empty_result',
    });
    throw new Error('Lead intake transaction failed.');
  }
  const result = response.data[0];
  const intake: IntakeResult = {
    submissionId: result.submission_id,
    personId: result.person_id,
    opportunityId: result.opportunity_id,
    taskId: result.task_id,
    touchpointId: result.touchpoint_id,
    leadScoreId: result.lead_score_id,
    conflictDetected: result.conflict_detected,
    duplicate: result.duplicate,
  };
  if (!intake.duplicate) await deliverOutboxForSubmission(db, intake.submissionId);
  logger.log('info', intake.duplicate ? 'FORM_DUPLICATE_REPLAYED' : 'FORM_ACCEPTED', {
    formType: start ? 'START_A_PROJECT' : 'CONTACT',
    submissionId: intake.submissionId,
    conflictDetected: intake.conflictDetected,
  });
  return intake;
}

function provider(): EmailProvider | null {
  return createEmailProvider({
    mailpitUrl: serverEnv.MAILPIT_URL,
    smtpHost: serverEnv.SMTP_HOST ?? serverEnv.ZOHO_SMTP_HOST,
    smtpPort: serverEnv.SMTP_PORT || serverEnv.ZOHO_SMTP_PORT || 25,
    smtpUser: serverEnv.SMTP_USER ?? serverEnv.ZOHO_SMTP_USER,
    smtpPassword: serverEnv.SMTP_PASSWORD ?? serverEnv.ZOHO_SMTP_PASSWORD,
    smtpSecure: serverEnv.SMTP_SECURE,
  });
}

function renderEmail(template: string, recipient: string, payload: Record<string, unknown>) {
  if (template === 'LEAD_CONFIRMATION_V1') {
    return {
      to: recipient,
      subject: 'We received your Zavlio enquiry',
      text: `Hi ${String(payload.name ?? 'there')},\n\nThanks for reaching out to Zavlio. We received your enquiry and will review it shortly.\n\n— Zavlio`,
    };
  }
  const details = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join('\n');
  return {
    to: recipient,
    subject: 'New Zavlio lead enquiry',
    text: `A new website enquiry was received.\n\n${details}`,
  };
}

async function deliverOutboxForSubmission(
  db: ReturnType<typeof createAdminDatabaseClient>,
  submissionId: string,
) {
  const { data: rows } = await db
    .from('email_outbox')
    .select('id,template,recipient,payload,attempt_count,status')
    .eq('submission_id', submissionId)
    .eq('status', 'PENDING');
  if (!rows?.length) return;
  const mailer = provider();
  for (const row of rows) {
    if (!mailer) {
      await db
        .from('email_outbox')
        .update({
          status: 'FAILED',
          failure_reason: 'email_not_configured',
          attempt_count: row.attempt_count + 1,
        })
        .eq('id', row.id);
      continue;
    }
    try {
      const message = renderEmail(
        row.template,
        row.recipient,
        (row.payload ?? {}) as Record<string, unknown>,
      );
      await mailer.send({ from: serverEnv.MAIL_FROM ?? 'no-reply@localhost', ...message });
      await db
        .from('email_outbox')
        .update({
          status: 'SENT',
          sent_at: new Date().toISOString(),
          attempt_count: row.attempt_count + 1,
          failure_reason: null,
        })
        .eq('id', row.id);
    } catch (error) {
      const reason = error instanceof EmailDeliveryError ? 'delivery_failed' : 'delivery_failed';
      await db
        .from('email_outbox')
        .update({ status: 'FAILED', failure_reason: reason, attempt_count: row.attempt_count + 1 })
        .eq('id', row.id);
      logger.log('error', 'EMAIL_SEND_FAILED', {
        submissionId,
        outboxId: row.id,
        template: row.template,
      });
    }
  }
}
