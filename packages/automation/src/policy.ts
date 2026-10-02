export const COMMUNICATION_PURPOSES = [
  'MARKETING',
  'SALES_FOLLOW_UP',
  'INBOUND_REPLY',
  'TRANSACTIONAL',
  'RELATIONSHIP',
  'INTERNAL',
] as const;
export const AUTOMATION_CHANNELS = [
  'EMAIL',
  'INSTAGRAM',
  'THREADS',
  'FACEBOOK',
  'LINKEDIN',
  'INTERNAL',
] as const;
export const AUTOMATION_ACTIONS = [
  'SEND_EMAIL',
  'DM',
  'REPLY',
  'COMMENT',
  'LIKE',
  'FOLLOW',
  'CONNECT',
  'PUBLISH',
  'CREATE_TASK',
  'FLAG_FOR_REVIEW',
  'NOOP',
] as const;
export type CommunicationPurpose = (typeof COMMUNICATION_PURPOSES)[number];
export type AutomationChannel = (typeof AUTOMATION_CHANNELS)[number];
export type AutomationActionType = (typeof AUTOMATION_ACTIONS)[number];
export type AutomationJobStatus =
  | 'QUEUED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'MANUAL_ACTION_REQUIRED'
  | 'CANCELLED';
export type AutomationDecision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL' | 'DEFER';
export type AutomationReasonCode =
  | 'AUTOMATION_DISABLED'
  | 'DRY_RUN_ONLY'
  | 'PERSON_NOT_FOUND'
  | 'PERSON_MERGED'
  | 'PERSON_ARCHIVED'
  | 'DNC_BLOCKED'
  | 'CONSENT_MISSING'
  | 'CONSENT_WITHDRAWN'
  | 'CHANNEL_DISABLED'
  | 'ACTION_DISABLED'
  | 'PURPOSE_DISABLED'
  | 'INTEGRATION_UNAVAILABLE'
  | 'IDENTITY_REQUIRED'
  | 'IDENTITY_MISMATCH'
  | 'IDENTITY_CONFLICT'
  | 'OUTSIDE_WORKING_HOURS'
  | 'PERSON_COOLDOWN'
  | 'PERSON_FREQUENCY_CAP'
  | 'GLOBAL_ACTION_CAP'
  | 'CHANNEL_CAP'
  | 'DUPLICATE_JOB'
  | 'OPPORTUNITY_CLOSED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_EXPIRED'
  | 'APPROVAL_INVALIDATED'
  | 'POLICY_CHANGED'
  | 'AGENT_UNAVAILABLE';
export interface WorkingHoursPolicy {
  readonly enabled: boolean;
  readonly timezone: string;
  readonly weekdays: readonly number[];
  readonly start: string;
  readonly end: string;
}
export interface ConsentRequirement {
  readonly purpose: CommunicationPurpose;
  readonly channel: AutomationChannel | 'SOCIAL';
  readonly permission: 'marketing_email' | 'marketing_social' | 'personalization';
}
export interface AutomationPolicy {
  readonly version: number;
  readonly enabled: boolean;
  readonly dryRun: boolean;
  readonly approvalRequired: boolean;
  readonly allowedChannels: readonly AutomationChannel[];
  readonly allowedActions: readonly AutomationActionType[];
  readonly allowedPurposes: readonly CommunicationPurpose[];
  readonly consentRequirements: readonly ConsentRequirement[];
  readonly workingHours: WorkingHoursPolicy;
  readonly cooldownMinutes: number;
  readonly personDailyCap: number;
  readonly personWeeklyCap: number;
  readonly channelHourlyCaps: Readonly<Partial<Record<AutomationChannel, number>>>;
  readonly actionHourlyCaps: Readonly<Partial<Record<AutomationActionType, number>>>;
  readonly duplicateWindowMinutes: number;
  readonly approvalValidityMinutes: number;
  readonly leaseSeconds: number;
  readonly maxAttempts: number;
  readonly retryBackoffSeconds: readonly number[];
}
export interface AutomationPolicyContext {
  readonly personExists: boolean;
  readonly personMerged: boolean;
  readonly personArchived: boolean;
  readonly doNotContact: boolean;
  readonly channel: AutomationChannel;
  readonly action: AutomationActionType;
  readonly purpose: CommunicationPurpose;
  readonly externalSideEffect: boolean;
  readonly integrationAvailable: boolean;
  readonly identityRequired: boolean;
  readonly identityMatchesChannel: boolean;
  readonly identityConflict: boolean;
  readonly permissions: Readonly<
    Partial<
      Record<
        'marketing_email' | 'marketing_social' | 'personalization',
        'GRANTED' | 'DENIED' | 'WITHDRAWN' | 'UNKNOWN'
      >
    >
  >;
  readonly opportunityClosed: boolean;
  readonly semanticallyDuplicate: boolean;
  readonly lastOutboundAt: string | null;
  readonly personActionsLast24Hours: number;
  readonly personActionsLast7Days: number;
  readonly channelActionsLastHour: number;
  readonly actionCountLastHour: number;
  readonly approval?: Readonly<{ expiresAt: string; policyVersion: number; payloadHash: string }>;
  readonly payloadHash: string;
  readonly agentAvailable: boolean;
}
export interface AutomationPolicyDecision {
  readonly eligible: boolean;
  readonly decision: AutomationDecision;
  readonly reasonCodes: readonly AutomationReasonCode[];
  readonly reasons: readonly string[];
  readonly nextEligibleAt: string | null;
  readonly approvalRequired: boolean;
  readonly policyVersion: number;
  readonly evaluatedAt: string;
}
const reasonText: Record<AutomationReasonCode, string> = {
  AUTOMATION_DISABLED: 'Automation is disabled.',
  DRY_RUN_ONLY: 'The action is restricted to dry-run simulation.',
  PERSON_NOT_FOUND: 'The person no longer exists.',
  PERSON_MERGED: 'The job targets a merged source person and requires review.',
  PERSON_ARCHIVED: 'The person is archived.',
  DNC_BLOCKED: 'Do-not-contact blocks proactive outbound communication.',
  CONSENT_MISSING: 'The required communication permission is unknown or missing.',
  CONSENT_WITHDRAWN: 'The required communication permission was denied or withdrawn.',
  CHANNEL_DISABLED: 'The channel is disabled by policy.',
  ACTION_DISABLED: 'The action is disabled by policy.',
  PURPOSE_DISABLED: 'The communication purpose is disabled by policy.',
  INTEGRATION_UNAVAILABLE: 'No execution integration is available for this channel.',
  IDENTITY_REQUIRED: 'A channel-specific target identity is required.',
  IDENTITY_MISMATCH: 'The target identity does not match the selected channel.',
  IDENTITY_CONFLICT: 'The target identity has an unresolved conflict.',
  OUTSIDE_WORKING_HOURS: 'The current time is outside configured working hours.',
  PERSON_COOLDOWN: 'The person is still inside the proactive-contact cooldown.',
  PERSON_FREQUENCY_CAP: 'The person contact frequency cap has been reached.',
  GLOBAL_ACTION_CAP: 'The action frequency cap has been reached.',
  CHANNEL_CAP: 'The channel frequency cap has been reached.',
  DUPLICATE_JOB: 'An equivalent action already exists inside the duplicate window.',
  OPPORTUNITY_CLOSED: 'The related sales opportunity is closed.',
  APPROVAL_REQUIRED: 'Current human approval is required.',
  APPROVAL_EXPIRED: 'The human approval has expired.',
  APPROVAL_INVALIDATED: 'The approved content no longer matches the execution payload.',
  POLICY_CHANGED: 'The active policy differs from the approved policy.',
  AGENT_UNAVAILABLE: 'No enabled online compatible agent is available.',
};
const proactive = (p: CommunicationPurpose) =>
  p === 'MARKETING' || p === 'SALES_FOLLOW_UP' || p === 'RELATIONSHIP';
const social = (c: AutomationChannel) =>
  ['INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN'].includes(c);
const clock = (s: string) => {
  const m = /^([0-9]{2}):([0-9]{2})$/.exec(s);
  if (!m) throw new Error('Invalid policy time');
  return Number(m[1]) * 60 + Number(m[2]);
};
const local = (d: Date, z: string) => {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: z,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const g = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? '';
  return {
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(g('weekday')) + 1,
    minute: Number(g('hour')) * 60 + Number(g('minute')),
  };
};
const inside = (d: Date, r: WorkingHoursPolicy) => {
  if (!r.enabled) return true;
  const p = local(d, r.timezone);
  return r.weekdays.includes(p.day) && p.minute >= clock(r.start) && p.minute < clock(r.end);
};
const nextWindow = (d: Date, r: WorkingHoursPolicy) => {
  const p = new Date(d);
  p.setUTCSeconds(0, 0);
  for (let i = 0; i <= 11520; i++) {
    if (inside(p, r)) return p.toISOString();
    p.setUTCMinutes(p.getUTCMinutes() + 1);
  }
  throw new Error('No reachable working window');
};
export function evaluateAutomationPolicy(
  c: AutomationPolicyContext,
  p: AutomationPolicy,
  asOf: string,
): AutomationPolicyDecision {
  const now = new Date(asOf);
  if (Number.isNaN(now.getTime())) throw new Error('Valid evaluation time required');
  const blocks: AutomationReasonCode[] = [],
    defers: Array<{ code: AutomationReasonCode; at: string | null }> = [],
    notes: AutomationReasonCode[] = [];
  if (!p.enabled) blocks.push('AUTOMATION_DISABLED');
  if (p.dryRun && c.externalSideEffect) notes.push('DRY_RUN_ONLY');
  if (!c.personExists) blocks.push('PERSON_NOT_FOUND');
  else if (c.personMerged) blocks.push('PERSON_MERGED');
  else if (c.personArchived) blocks.push('PERSON_ARCHIVED');
  if (!p.allowedChannels.includes(c.channel)) blocks.push('CHANNEL_DISABLED');
  if (!p.allowedActions.includes(c.action)) blocks.push('ACTION_DISABLED');
  if (!p.allowedPurposes.includes(c.purpose)) blocks.push('PURPOSE_DISABLED');
  if (c.externalSideEffect && !p.dryRun && !c.integrationAvailable)
    blocks.push('INTEGRATION_UNAVAILABLE');
  if (c.identityRequired && !c.identityMatchesChannel) blocks.push('IDENTITY_REQUIRED');
  if (c.identityRequired && !c.identityMatchesChannel) blocks.push('IDENTITY_MISMATCH');
  if (c.identityConflict) blocks.push('IDENTITY_CONFLICT');
  if (c.doNotContact && proactive(c.purpose)) blocks.push('DNC_BLOCKED');
  const req = p.consentRequirements.find(
    (x) =>
      x.purpose === c.purpose &&
      (x.channel === c.channel || (x.channel === 'SOCIAL' && social(c.channel))),
  );
  if (req) {
    const v = c.permissions[req.permission] ?? 'UNKNOWN';
    if (v === 'UNKNOWN') blocks.push('CONSENT_MISSING');
    else if (v !== 'GRANTED') blocks.push('CONSENT_WITHDRAWN');
  }
  if (c.opportunityClosed && c.purpose === 'SALES_FOLLOW_UP') blocks.push('OPPORTUNITY_CLOSED');
  if (c.semanticallyDuplicate) blocks.push('DUPLICATE_JOB');
  if (proactive(c.purpose) && c.lastOutboundAt && p.cooldownMinutes > 0) {
    const at = new Date(
      new Date(c.lastOutboundAt).getTime() + p.cooldownMinutes * 60000,
    ).toISOString();
    if (new Date(at) > now) defers.push({ code: 'PERSON_COOLDOWN', at });
  }
  if (p.personDailyCap > 0 && c.personActionsLast24Hours >= p.personDailyCap)
    defers.push({
      code: 'PERSON_FREQUENCY_CAP',
      at: new Date(now.getTime() + 86400000).toISOString(),
    });
  if (p.personWeeklyCap > 0 && c.personActionsLast7Days >= p.personWeeklyCap)
    defers.push({
      code: 'PERSON_FREQUENCY_CAP',
      at: new Date(now.getTime() + 604800000).toISOString(),
    });
  const cc = p.channelHourlyCaps[c.channel] ?? 0;
  if (cc > 0 && c.channelActionsLastHour >= cc)
    defers.push({ code: 'CHANNEL_CAP', at: new Date(now.getTime() + 3600000).toISOString() });
  const ac = p.actionHourlyCaps[c.action] ?? 0;
  if (ac > 0 && c.actionCountLastHour >= ac)
    defers.push({ code: 'GLOBAL_ACTION_CAP', at: new Date(now.getTime() + 3600000).toISOString() });
  if (c.externalSideEffect && !inside(now, p.workingHours))
    defers.push({ code: 'OUTSIDE_WORKING_HOURS', at: nextWindow(now, p.workingHours) });
  const approvalRequired = c.externalSideEffect && p.approvalRequired;
  if (approvalRequired) {
    if (!c.approval) notes.push('APPROVAL_REQUIRED');
    else {
      if (new Date(c.approval.expiresAt) <= now) notes.push('APPROVAL_EXPIRED');
      if (c.approval.policyVersion !== p.version) notes.push('POLICY_CHANGED');
      if (c.approval.payloadHash !== c.payloadHash) notes.push('APPROVAL_INVALIDATED');
    }
  }
  if (c.externalSideEffect && !c.agentAvailable && !p.dryRun)
    defers.push({ code: 'AGENT_UNAVAILABLE', at: null });
  let decision: AutomationDecision = 'ALLOW',
    codes: AutomationReasonCode[] = notes,
    nextEligibleAt: string | null = null;
  if (blocks.length) {
    decision = 'BLOCK';
    codes = [...blocks, ...notes.filter((x) => x === 'DRY_RUN_ONLY')];
  } else if (defers.length) {
    decision = 'DEFER';
    codes = [...defers.map((x) => x.code), ...notes.filter((x) => x === 'DRY_RUN_ONLY')];
    nextEligibleAt =
      defers
        .map((x) => x.at)
        .filter((x): x is string => x !== null)
        .sort()
        .at(-1) ?? null;
  } else if (notes.some((x) => x !== 'DRY_RUN_ONLY')) decision = 'REQUIRE_APPROVAL';
  const unique = [...new Set(codes)];
  return {
    eligible: decision === 'ALLOW',
    decision,
    reasonCodes: unique,
    reasons: unique.map((x) => reasonText[x]),
    nextEligibleAt,
    approvalRequired,
    policyVersion: p.version,
    evaluatedAt: now.toISOString(),
  };
}
export function retryDelaySeconds(p: AutomationPolicy, attempt: number) {
  if (attempt >= p.maxAttempts) return null;
  return (
    p.retryBackoffSeconds[Math.min(Math.max(attempt - 1, 0), p.retryBackoffSeconds.length - 1)] ??
    null
  );
}
