import { createHash } from 'node:crypto';
import { z } from 'zod';

export const META_ADAPTER_VERSION = '15.0.0' as const;
export const UPSTREAM_PACKAGE_VERSION = '2.0.0' as const;
export const UPSTREAM_COMMIT = '439c3bfaacb1caabef25a7d67c3f204916a5a168' as const;
export const UPSTREAM_TREE = 'e4f412bc7ff86261f0753a1f088c5f271af9246c' as const;

export const platforms = ['THREADS', 'FACEBOOK', 'LINKEDIN'] as const;
export type AdapterPlatform = (typeof platforms)[number];
export const actions = ['DM', 'REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'CONNECT', 'PUBLISH'] as const;
export type AdapterAction = (typeof actions)[number];
export const textActions = new Set<AdapterAction>(['DM', 'REPLY', 'COMMENT', 'PUBLISH']);

export const targetIdentitySchema = z
  .object({
    platform: z.enum(platforms),
    username: z.string().trim().min(1).max(160).optional(),
    stableId: z.string().trim().min(1).max(200).optional(),
    profileUrl: z.url().max(500).optional(),
    conversationId: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.username || value.stableId || value.profileUrl), {
    message: 'A deterministic target identity is required.',
  });

export const adapterJobSchema = z
  .object({
    jobId: z.string().trim().min(1).max(100),
    jobVersion: z.number().int().positive(),
    attemptNumber: z.number().int().positive(),
    channel: z.enum(platforms),
    actionType: z.enum(actions),
    personId: z.uuid().optional(),
    purpose: z.string().trim().min(1).max(60),
    dryRun: z.literal(true),
    targetIdentity: targetIdentitySchema,
    content: z.string().max(10000).optional(),
    contentHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    profileUrl: z.url().max(500).optional(),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.targetIdentity.platform !== value.channel)
      ctx.addIssue({
        code: 'custom',
        path: ['targetIdentity', 'platform'],
        message: 'Target platform does not match job channel.',
      });
    if (textActions.has(value.actionType) && typeof value.content !== 'string')
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'This action requires approved content.',
      });
    if (textActions.has(value.actionType) && typeof value.contentHash !== 'string')
      ctx.addIssue({
        code: 'custom',
        path: ['contentHash'],
        message: 'Text actions require an approved content hash.',
      });
    if (
      textActions.has(value.actionType) &&
      typeof value.content === 'string' &&
      typeof value.contentHash === 'string' &&
      sha256Content(value.content) !== value.contentHash
    )
      ctx.addIssue({
        code: 'custom',
        path: ['contentHash'],
        message: 'Approved content hash mismatch.',
      });
    if (
      !textActions.has(value.actionType) &&
      (value.content !== undefined || value.contentHash !== undefined)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'Non-text actions cannot carry content or a content hash.',
      });
  });
export type AdapterJob = z.infer<typeof adapterJobSchema>;

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalValue(entry)]),
    );
  }
  return value;
}

export function canonicalExecutionContract(job: AdapterJob): string {
  return JSON.stringify(
    canonicalValue({
      jobId: job.jobId,
      jobVersion: job.jobVersion,
      attemptNumber: job.attemptNumber,
      personId: job.personId ?? null,
      channel: job.channel,
      actionType: job.actionType,
      purpose: job.purpose,
      dryRun: job.dryRun,
      targetIdentity: job.targetIdentity,
      profileUrl: job.profileUrl ?? null,
      contentHash: job.contentHash ?? null,
      payload: job.payload,
    }),
  );
}

export function executionContractHash(job: AdapterJob): string {
  return createHash('sha256').update(canonicalExecutionContract(job), 'utf8').digest('hex');
}

export const PREPARATION_TTL_MS = 120_000;

export const primitiveSchema = z.enum([
  'NAVIGATE_ALLOWED_ORIGIN',
  'CLICK',
  'TYPE_EXACT',
  'SCROLL',
  'WAIT',
  'EXTRACT',
  'STOP',
]);
export type AdapterPrimitive = z.infer<typeof primitiveSchema>;
export const planStepSchema = z
  .object({
    type: primitiveSchema,
    elementId: z.number().int().positive().optional(),
    value: z.string().max(10000).optional(),
    binding: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export const planSchema = z
  .object({
    status: z.enum(['ACT', 'WAIT', 'READY', 'STOP']),
    reason: z.string().trim().max(500),
    steps: z.array(planStepSchema).max(12),
  })
  .strict();
export type AdapterPlan = z.infer<typeof planSchema>;

export const adapterOperationSchema = z.enum([
  'INIT',
  'HEALTH',
  'OBSERVE_PLATFORM',
  'PREPARE_ACTION',
  'EXECUTE_APPROVED_ACTION',
  'ABORT',
  'STOP',
]);
export type AdapterOperation = z.infer<typeof adapterOperationSchema>;
export const childRequestSchema = z
  .object({
    requestId: z.uuid(),
    operation: adapterOperationSchema,
    jobId: z.string().trim().min(1).max(100).optional(),
    jobVersion: z.number().int().positive().optional(),
    payload: z.unknown().optional(),
  })
  .strict();
export type ChildRequest = z.infer<typeof childRequestSchema>;
export const childResponseSchema = z
  .object({
    ok: z.boolean(),
    requestId: z.uuid(),
    status: z.string().trim().min(1).max(100),
    result: z.unknown().optional(),
    evidence: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
    error: z.string().trim().max(500).optional(),
  })
  .strict();
export type ChildResponse = z.infer<typeof childResponseSchema>;

export function sha256Content(content: string): string {
  return createHash('sha256')
    .update(content.normalize('NFC').replaceAll('\r\n', '\n'), 'utf8')
    .digest('hex');
}

export function normalizeContent(content: string): string {
  return content.normalize('NFC').replaceAll('\r\n', '\n');
}
