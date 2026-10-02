import { z } from 'zod';

export const MACHINE_PROTOCOL_VERSION = 1 as const;
export const MACHINE_ENDPOINT_PREFIX = '/api/internal/automation/v1' as const;
export const MACHINE_MAX_BODY_BYTES = 64 * 1024;
export const MACHINE_MAX_EVIDENCE_BYTES = 16 * 1024;
export const MACHINE_TIMESTAMP_TOLERANCE_SECONDS = 300;
export const MACHINE_NONCE_RETENTION_HOURS = 24;
export const PACKET_14_CAPABILITIES = {
  channels: ['INTERNAL'],
  actions: ['NOOP'],
  executionModes: ['DRY_RUN_ONLY'],
} as const;
/**
 * Packet 15 is an explicit, dry-run-only expansion of the Packet 14 cable.
 * It never includes Instagram or a live execution mode.
 */
export const PACKET_15_CAPABILITIES = {
  channels: ['INTERNAL', 'THREADS', 'FACEBOOK', 'LINKEDIN'],
  actions: ['NOOP', 'DM', 'REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'CONNECT', 'PUBLISH'],
  executionModes: ['DRY_RUN_ONLY'],
} as const;
export const MACHINE_HEADERS = {
  agentKey: 'x-zavlio-agent-key',
  keyId: 'x-zavlio-key-id',
  protocolVersion: 'x-zavlio-protocol-version',
  timestamp: 'x-zavlio-timestamp',
  nonce: 'x-zavlio-nonce',
  contentSha256: 'x-zavlio-content-sha256',
  signature: 'x-zavlio-signature',
  bridgeVersion: 'x-zavlio-bridge-version',
} as const;

const uuid = z.uuid();
export const machineCapabilitiesSchema = z
  .object({
    channels: z
      .array(z.enum(['INTERNAL', 'EMAIL', 'INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN']))
      .max(12),
    actions: z
      .array(
        z.enum([
          'NOOP',
          'CREATE_TASK',
          'FLAG_FOR_REVIEW',
          'SEND_EMAIL',
          'DM',
          'REPLY',
          'COMMENT',
          'LIKE',
          'FOLLOW',
          'CONNECT',
          'PUBLISH',
        ]),
      )
      .max(20),
    executionModes: z.array(z.literal('DRY_RUN_ONLY')).max(2),
  })
  .strict();
export type MachineCapabilities = z.infer<typeof machineCapabilitiesSchema>;
const operation = z.object({ operationId: uuid, instanceId: uuid });
export const handshakeRequestSchema = operation
  .extend({
    bridgeVersion: z.string().trim().min(1).max(100),
    supportedProtocolVersions: z.array(z.number().int()).min(1).max(5),
    executionModes: z.array(z.literal('DRY_RUN_ONLY')).min(1).max(2),
    capabilities: machineCapabilitiesSchema,
    startedAt: z.iso.datetime(),
  })
  .strict();
export const heartbeatRequestSchema = operation
  .extend({
    bridgeVersion: z.string().trim().min(1).max(100),
    protocolVersion: z.literal(MACHINE_PROTOCOL_VERSION),
    uptimeSeconds: z.number().int().min(0).max(31_536_000),
    executorMode: z.literal('DRY_RUN_ONLY'),
    capabilities: machineCapabilitiesSchema,
    activeJobs: z.number().int().min(0).max(1),
    runtimeState: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .refine((x) => JSON.stringify(x).length <= 4096),
  })
  .strict();
export const claimRequestSchema = operation.extend({ maxJobs: z.literal(1) }).strict();
export const leaseRequestSchema = operation
  .extend({
    expectedJobVersion: z.number().int().positive(),
    expectedLeaseExpiresAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const startRequestSchema = operation
  .extend({
    expectedJobVersion: z.number().int().positive(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    policyVersion: z.number().int().positive(),
    expectedLeaseExpiresAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const resultRequestSchema = operation
  .extend({
    expectedJobVersion: z.number().int().positive(),
    resultType: z.enum([
      'SUCCESS',
      'TRANSIENT_FAILURE',
      'PERMANENT_FAILURE',
      'MANUAL_ACTION_REQUIRED',
      'UNKNOWN_OUTCOME',
    ]),
    dryRun: z.literal(true),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
    evidence: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    failureCode: z.string().trim().min(2).max(100).nullable().optional(),
    failureSummary: z.string().trim().max(500).nullable().optional(),
    retryAfter: z.iso.datetime().nullable().optional(),
  })
  .strict()
  .refine((x) => JSON.stringify(x.evidence).length <= MACHINE_MAX_EVIDENCE_BYTES, {
    message: 'Evidence exceeds 16 KiB.',
  });

export const socialObservationRequestSchema = operation
  .extend({
    platform: z.enum(['THREADS', 'FACEBOOK', 'LINKEDIN']),
    providerVersion: z.string().trim().min(1).max(64),
    schemaVersion: z.literal('SOCIAL_OBSERVATION_V1'),
    providerIdentityKey: z.string().trim().min(1).max(512),
    providerIdentity: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    ),
    conversationProviderId: z.string().trim().min(1).max(512).nullable(),
    normalizedMessages: z
      .array(
        z
          .object({
            providerMessageId: z.string().trim().min(1).max(512).optional(),
            sender: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
            direction: z.enum(['INBOUND', 'OUTBOUND']),
            body: z.string().max(4000),
            providerTimestamp: z.iso.datetime().nullable().optional(),
            edited: z.boolean().optional(),
            deleted: z.boolean().optional(),
          })
          .strict(),
      )
      .max(100),
    authState: z.enum(['AUTHENTICATED', 'LOGIN_REQUIRED', 'SECURITY_CHALLENGE', 'UNKNOWN']),
    observedAt: z.iso.datetime(),
  })
  .strict()
  .refine((x) => JSON.stringify(x).length <= MACHINE_MAX_BODY_BYTES, {
    message: 'Social observation exceeds protocol body limit.',
  });
export const protocolSchemas = {
  handshake: handshakeRequestSchema,
  heartbeat: heartbeatRequestSchema,
  claim: claimRequestSchema,
  lease: leaseRequestSchema,
  start: startRequestSchema,
  result: resultRequestSchema,
  socialObservation: socialObservationRequestSchema,
} as const;

export function canonicalMachineRequest(input: {
  method: string;
  pathname: string;
  agentKey: string;
  keyId: string;
  timestamp: string;
  nonce: string;
  bodySha256: string;
}) {
  return [
    'v1',
    input.method.toUpperCase(),
    input.pathname,
    input.agentKey,
    input.keyId,
    input.timestamp,
    input.nonce,
    input.bodySha256,
  ].join('\n');
}
export function intersectCapabilities(
  registered: MachineCapabilities,
  requested: MachineCapabilities,
): MachineCapabilities {
  return {
    channels: requested.channels.filter((x) => registered.channels.includes(x)),
    actions: requested.actions.filter((x) => registered.actions.includes(x)),
    executionModes: requested.executionModes.filter((x) => registered.executionModes.includes(x)),
  };
}
export function isTimestampAccepted(
  timestampSeconds: number,
  nowMs: number,
  tolerance = MACHINE_TIMESTAMP_TOLERANCE_SECONDS,
) {
  return (
    Number.isInteger(timestampSeconds) &&
    Math.abs(timestampSeconds - Math.floor(nowMs / 1000)) <= tolerance
  );
}
export function assertSafeControlPlaneUrl(url: string, production: boolean) {
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (production && parsed.protocol !== 'https:' && !local)
    throw new Error('Production control-plane URL must use HTTPS.');
  if (!['http:', 'https:'].includes(parsed.protocol))
    throw new Error('Control-plane URL must use HTTP(S).');
  if (parsed.username || parsed.password || parsed.search || parsed.hash)
    throw new Error('Control-plane URL must not contain credentials, query, or fragment.');
  return parsed;
}
