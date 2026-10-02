import { describe, expect, it } from 'vitest';
import {
  DryRunExecutor,
  evaluateAutomationPolicy,
  retryDelaySeconds,
  type AutomationPolicy,
  type AutomationPolicyContext,
} from '@zavlio/automation';
const policy: AutomationPolicy = {
  version: 2,
  enabled: true,
  dryRun: true,
  approvalRequired: true,
  allowedChannels: ['EMAIL', 'INSTAGRAM', 'INTERNAL'],
  allowedActions: ['SEND_EMAIL', 'DM', 'REPLY', 'CREATE_TASK'],
  allowedPurposes: ['MARKETING', 'SALES_FOLLOW_UP', 'INBOUND_REPLY', 'TRANSACTIONAL', 'INTERNAL'],
  consentRequirements: [
    { purpose: 'MARKETING', channel: 'EMAIL', permission: 'marketing_email' },
    { purpose: 'SALES_FOLLOW_UP', channel: 'SOCIAL', permission: 'marketing_social' },
  ],
  workingHours: {
    enabled: true,
    timezone: 'Asia/Kolkata',
    weekdays: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
  },
  cooldownMinutes: 60,
  personDailyCap: 2,
  personWeeklyCap: 5,
  channelHourlyCaps: { EMAIL: 10 },
  actionHourlyCaps: { DM: 5 },
  duplicateWindowMinutes: 60,
  approvalValidityMinutes: 1440,
  leaseSeconds: 300,
  maxAttempts: 3,
  retryBackoffSeconds: [60, 300, 1800],
};
const context: AutomationPolicyContext = {
  personExists: true,
  personMerged: false,
  personArchived: false,
  doNotContact: false,
  channel: 'EMAIL',
  action: 'SEND_EMAIL',
  purpose: 'MARKETING',
  externalSideEffect: true,
  integrationAvailable: false,
  identityRequired: false,
  identityMatchesChannel: true,
  identityConflict: false,
  permissions: { marketing_email: 'GRANTED', marketing_social: 'GRANTED' },
  opportunityClosed: false,
  semanticallyDuplicate: false,
  lastOutboundAt: null,
  personActionsLast24Hours: 0,
  personActionsLast7Days: 0,
  channelActionsLastHour: 0,
  actionCountLastHour: 0,
  payloadHash: 'a',
  agentAvailable: false,
};
const at = '2026-09-28T05:00:00.000Z'; // Monday 10:30 Asia/Kolkata
const evaluate = (
  change: Partial<AutomationPolicyContext> = {},
  p: Partial<AutomationPolicy> = {},
) => evaluateAutomationPolicy({ ...context, ...change }, { ...policy, ...p }, at);
describe('automation policy', () => {
  it('requires approval and records dry-run mode', () =>
    expect(evaluate().reasonCodes).toEqual(['DRY_RUN_ONLY', 'APPROVAL_REQUIRED']));
  it('allows a matching current approval', () =>
    expect(
      evaluate({
        approval: { expiresAt: '2026-09-29T05:00:00.000Z', policyVersion: 2, payloadHash: 'a' },
      }).decision,
    ).toBe('ALLOW'));
  it('blocks disabled automation', () =>
    expect(evaluate({}, { enabled: false }).reasonCodes).toContain('AUTOMATION_DISABLED'));
  it('blocks DNC despite priority being outside policy facts', () =>
    expect(evaluate({ doNotContact: true }).reasonCodes).toContain('DNC_BLOCKED'));
  it('does not apply proactive DNC rule to inbound reply', () =>
    expect(
      evaluate({ doNotContact: true, purpose: 'INBOUND_REPLY', action: 'REPLY' }).reasonCodes,
    ).not.toContain('DNC_BLOCKED'));
  it('blocks missing consent', () =>
    expect(evaluate({ permissions: { marketing_email: 'UNKNOWN' } }).reasonCodes).toContain(
      'CONSENT_MISSING',
    ));
  it('blocks withdrawn consent', () =>
    expect(evaluate({ permissions: { marketing_email: 'WITHDRAWN' } }).reasonCodes).toContain(
      'CONSENT_WITHDRAWN',
    ));
  it('blocks a disabled channel', () =>
    expect(evaluate({ channel: 'FACEBOOK' }).reasonCodes).toContain('CHANNEL_DISABLED'));
  it('blocks a disabled action', () =>
    expect(evaluate({ action: 'PUBLISH' }).reasonCodes).toContain('ACTION_DISABLED'));
  it('blocks a disabled purpose', () =>
    expect(evaluate({ purpose: 'RELATIONSHIP' }).reasonCodes).toContain('PURPOSE_DISABLED'));
  it('allows unavailable integration only in dry-run', () =>
    expect(evaluate({}, { dryRun: false }).reasonCodes).toContain('INTEGRATION_UNAVAILABLE'));
  it('blocks missing person', () =>
    expect(evaluate({ personExists: false }).reasonCodes).toContain('PERSON_NOT_FOUND'));
  it('blocks merged person', () =>
    expect(evaluate({ personMerged: true }).reasonCodes).toContain('PERSON_MERGED'));
  it('blocks archived person', () =>
    expect(evaluate({ personArchived: true }).reasonCodes).toContain('PERSON_ARCHIVED'));
  it('blocks closed sales opportunity', () =>
    expect(
      evaluate({
        purpose: 'SALES_FOLLOW_UP',
        channel: 'INSTAGRAM',
        action: 'DM',
        opportunityClosed: true,
      }).reasonCodes,
    ).toContain('OPPORTUNITY_CLOSED'));
  it('does not block inbound reply on closed opportunity', () =>
    expect(
      evaluate({ purpose: 'INBOUND_REPLY', action: 'REPLY', opportunityClosed: true }).reasonCodes,
    ).not.toContain('OPPORTUNITY_CLOSED'));
  it('blocks semantic duplicate', () =>
    expect(evaluate({ semanticallyDuplicate: true }).reasonCodes).toContain('DUPLICATE_JOB'));
  it('defers within cooldown', () =>
    expect(evaluate({ lastOutboundAt: '2026-09-28T04:30:00.000Z' }).reasonCodes).toContain(
      'PERSON_COOLDOWN',
    ));
  it('allows at exact cooldown boundary', () =>
    expect(evaluate({ lastOutboundAt: '2026-09-28T04:00:00.000Z' }).reasonCodes).not.toContain(
      'PERSON_COOLDOWN',
    ));
  it('defers at daily cap', () =>
    expect(evaluate({ personActionsLast24Hours: 2 }).reasonCodes).toContain(
      'PERSON_FREQUENCY_CAP',
    ));
  it('defers at weekly cap', () =>
    expect(evaluate({ personActionsLast7Days: 5 }).reasonCodes).toContain('PERSON_FREQUENCY_CAP'));
  it('defers at channel cap', () =>
    expect(evaluate({ channelActionsLastHour: 10 }).reasonCodes).toContain('CHANNEL_CAP'));
  it('defers at action cap', () =>
    expect(
      evaluate({
        channel: 'INSTAGRAM',
        action: 'DM',
        purpose: 'INBOUND_REPLY',
        actionCountLastHour: 5,
      }).reasonCodes,
    ).toContain('GLOBAL_ACTION_CAP'));
  it('defers before working hours to a supplied next time', () => {
    const d = evaluateAutomationPolicy(context, policy, '2026-09-28T02:00:00.000Z');
    expect(d.reasonCodes).toContain('OUTSIDE_WORKING_HOURS');
    expect(d.nextEligibleAt).toBe('2026-09-28T03:30:00.000Z');
  });
  it('defers on weekend', () =>
    expect(
      evaluateAutomationPolicy(context, policy, '2026-09-27T05:00:00.000Z').reasonCodes,
    ).toContain('OUTSIDE_WORKING_HOURS'));
  it('invalidates expired approval', () =>
    expect(
      evaluate({ approval: { expiresAt: at, policyVersion: 2, payloadHash: 'a' } }).reasonCodes,
    ).toContain('APPROVAL_EXPIRED'));
  it('invalidates approval after policy change', () =>
    expect(
      evaluate({
        approval: { expiresAt: '2026-09-29T05:00:00.000Z', policyVersion: 1, payloadHash: 'a' },
      }).reasonCodes,
    ).toContain('POLICY_CHANGED'));
  it('invalidates changed approved content', () =>
    expect(
      evaluate({
        approval: { expiresAt: '2026-09-29T05:00:00.000Z', policyVersion: 2, payloadHash: 'b' },
      }).reasonCodes,
    ).toContain('APPROVAL_INVALIDATED'));
  it('is deterministic for identical inputs', () => expect(evaluate()).toEqual(evaluate()));
  it('uses bounded retry schedule', () => {
    expect(retryDelaySeconds(policy, 1)).toBe(60);
    expect(retryDelaySeconds(policy, 2)).toBe(300);
    expect(retryDelaySeconds(policy, 3)).toBeNull();
  });
  it('dry-run executor refuses a real side effect', async () =>
    await expect(
      new DryRunExecutor().execute({ jobId: 'x', action: 'DM', dryRun: false }),
    ).rejects.toThrow('refuses real'));
  it('dry-run executor records simulated success', async () =>
    expect(await new DryRunExecutor().execute({ jobId: 'x', action: 'DM', dryRun: true })).toEqual({
      kind: 'SUCCESS',
    }));
});
