import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  MACHINE_HEADERS,
  MACHINE_MAX_BODY_BYTES,
  MACHINE_NONCE_RETENTION_HOURS,
  MACHINE_PROTOCOL_VERSION,
  canonicalMachineRequest,
  isTimestampAccepted,
  machineCapabilitiesSchema,
  type MachineCapabilities,
} from '@zavlio/automation/protocol';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { z } from 'zod';

const credentialFileSchema = z.record(
  z.string().min(1).max(100),
  z.object({
    current: z.object({ keyId: z.string().min(1).max(100), secret: z.string().min(43) }),
    previous: z
      .object({
        keyId: z.string().min(1).max(100),
        secret: z.string().min(43),
        validUntil: z.iso.datetime(),
      })
      .optional(),
  }),
);

export class MachineProtocolError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message = 'Machine request rejected.',
  ) {
    super(message);
  }
}
function secretBytes(value: string) {
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length < 32) throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  return bytes;
}
export function resolveMachineCredential(agentKey: string, keyId: string, now = new Date()) {
  let parsed: z.infer<typeof credentialFileSchema>;
  try {
    parsed = credentialFileSchema.parse(
      JSON.parse(process.env.AUTOMATION_MACHINE_KEYS_JSON ?? '{}'),
    );
  } catch {
    throw new MachineProtocolError(503, 'MACHINE_AUTH_UNAVAILABLE');
  }
  const record = parsed[agentKey];
  if (record?.current.keyId === keyId) return secretBytes(record.current.secret);
  if (record?.previous?.keyId === keyId && new Date(record.previous.validUntil) > now)
    return secretBytes(record.previous.secret);
  throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
}

export interface VerifiedMachineRequest {
  readonly agentId: string;
  readonly agentKey: string;
  readonly keyId: string;
  readonly protocolVersion: 1;
  readonly bridgeVersion: string;
  readonly requestId: string;
  readonly nonce: string;
  readonly authenticatedAt: string;
  readonly requestTimestampSeconds: number;
  readonly rawBody: string;
  readonly bodySha256: string;
  readonly registeredCapabilities: MachineCapabilities;
}

const windows = new Map<string, { minute: number; count: number }>();
function enforceRate(agentKey: string, pathname: string, nowMs: number) {
  const minute = Math.floor(nowMs / 60000);
  const key = agentKey + ':' + pathname;
  const current = windows.get(key);
  const limit = pathname.endsWith('/handshake') ? 10 : pathname.endsWith('/claim') ? 60 : 120;
  if (!current || current.minute !== minute) windows.set(key, { minute, count: 1 });
  else if (current.count >= limit) throw new MachineProtocolError(429, 'RATE_LIMITED');
  else current.count += 1;
  if (windows.size > 5000)
    for (const [k, v] of windows) if (v.minute < minute - 2) windows.delete(k);
}

export async function verifyMachineRequest(
  request: Request,
  nowMs = Date.now(),
): Promise<VerifiedMachineRequest> {
  const url = new URL(request.url);
  if (url.search) throw new MachineProtocolError(400, 'PROTOCOL_INVALID_BODY');
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const forwarded = request.headers.get('x-forwarded-proto');
  if (
    process.env.NODE_ENV === 'production' &&
    !local &&
    url.protocol !== 'https:' &&
    forwarded !== 'https'
  )
    throw new MachineProtocolError(400, 'HTTPS_REQUIRED');
  if (
    request.method !== 'POST' ||
    !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')
  )
    throw new MachineProtocolError(400, 'PROTOCOL_INVALID_BODY');
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MACHINE_MAX_BODY_BYTES)
    throw new MachineProtocolError(413, 'PROTOCOL_BODY_TOO_LARGE');
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.byteLength > MACHINE_MAX_BODY_BYTES)
    throw new MachineProtocolError(413, 'PROTOCOL_BODY_TOO_LARGE');
  const get = (name: string) => request.headers.get(name)?.trim() ?? '';
  const agentKey = get(MACHINE_HEADERS.agentKey),
    keyId = get(MACHINE_HEADERS.keyId),
    timestamp = get(MACHINE_HEADERS.timestamp),
    nonce = get(MACHINE_HEADERS.nonce).toLowerCase(),
    suppliedDigest = get(MACHINE_HEADERS.contentSha256).toLowerCase(),
    signature = get(MACHINE_HEADERS.signature),
    bridgeVersion = get(MACHINE_HEADERS.bridgeVersion),
    protocol = get(MACHINE_HEADERS.protocolVersion);
  if (
    !/^[a-z0-9][a-z0-9._-]{1,99}$/i.test(agentKey) ||
    !keyId ||
    protocol !== String(MACHINE_PROTOCOL_VERSION) ||
    !bridgeVersion ||
    !z.uuid().safeParse(nonce).success
  )
    throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  const timestampNumber = Number(timestamp);
  if (!isTimestampAccepted(timestampNumber, nowMs))
    throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(suppliedDigest) || digest !== suppliedDigest)
    throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  const secret = resolveMachineCredential(agentKey, keyId, new Date(nowMs));
  const canonical = canonicalMachineRequest({
    method: request.method,
    pathname: url.pathname,
    agentKey,
    keyId,
    timestamp,
    nonce,
    bodySha256: digest,
  });
  const expected = createHmac('sha256', secret).update(canonical).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature.startsWith('v1=') ? signature.slice(3) : '', 'base64url');
  } catch {
    throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected))
    throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  const db = createAdminDatabaseClient();
  const requestAt = new Date(timestampNumber * 1000);
  const consumed = await db.rpc('consume_automation_nonce', {
    p_agent_key: agentKey,
    p_nonce: nonce,
    p_request_timestamp: requestAt.toISOString(),
    p_expires_at: new Date(
      requestAt.getTime() + MACHINE_NONCE_RETENTION_HOURS * 3600000,
    ).toISOString(),
  });
  if (consumed.error || !consumed.data) throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  const agent = await db
    .from('automation_agents')
    .select('id,enabled,capabilities')
    .eq('id', consumed.data)
    .single();
  if (agent.error || !agent.data) throw new MachineProtocolError(401, 'MACHINE_AUTH_FAILED');
  if (!agent.data.enabled) throw new MachineProtocolError(403, 'AGENT_DISABLED');
  enforceRate(agentKey, url.pathname, nowMs);
  return {
    agentId: agent.data.id,
    agentKey,
    keyId,
    protocolVersion: 1,
    bridgeVersion,
    requestId: crypto.randomUUID(),
    nonce,
    authenticatedAt: new Date(nowMs).toISOString(),
    requestTimestampSeconds: timestampNumber,
    rawBody: bytes.toString('utf8'),
    bodySha256: digest,
    registeredCapabilities: machineCapabilitiesSchema.parse(agent.data.capabilities),
  };
}
