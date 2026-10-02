import { createHash, createHmac, randomUUID } from 'node:crypto';
import { MACHINE_HEADERS, canonicalMachineRequest } from '@zavlio/automation/protocol';
import type { BridgeEnv } from './env.js';

export interface SignedAttempt {
  readonly body: string;
  readonly headers: Readonly<Record<string, string>>;
}
export function signMachineRequest(input: {
  env: BridgeEnv;
  pathname: string;
  payload: unknown;
  clockSkewMs?: number;
  timestampSeconds?: number;
  nonce?: string;
}): SignedAttempt {
  const body = JSON.stringify(input.payload),
    bodySha256 = createHash('sha256').update(Buffer.from(body)).digest('hex');
  const timestamp = String(
    input.timestampSeconds ?? Math.floor((Date.now() + (input.clockSkewMs ?? 0)) / 1000),
  );
  const nonce = input.nonce ?? randomUUID();
  const canonical = canonicalMachineRequest({
    method: 'POST',
    pathname: input.pathname,
    agentKey: input.env.ZAVLIO_AGENT_KEY,
    keyId: input.env.ZAVLIO_MACHINE_KEY_ID,
    timestamp,
    nonce,
    bodySha256,
  });
  const signature = createHmac(
    'sha256',
    Buffer.from(input.env.ZAVLIO_MACHINE_HMAC_SECRET, 'base64url'),
  )
    .update(canonical)
    .digest('base64url');
  return {
    body,
    headers: {
      'content-type': 'application/json',
      [MACHINE_HEADERS.agentKey]: input.env.ZAVLIO_AGENT_KEY,
      [MACHINE_HEADERS.keyId]: input.env.ZAVLIO_MACHINE_KEY_ID,
      [MACHINE_HEADERS.protocolVersion]: '1',
      [MACHINE_HEADERS.timestamp]: timestamp,
      [MACHINE_HEADERS.nonce]: nonce,
      [MACHINE_HEADERS.contentSha256]: bodySha256,
      [MACHINE_HEADERS.signature]: 'v1=' + signature,
      [MACHINE_HEADERS.bridgeVersion]: input.env.ZAVLIO_BRIDGE_VERSION,
    },
  };
}
export interface MachineEnvelope {
  readonly ok: boolean;
  readonly protocolVersion?: number;
  readonly requestId: string;
  readonly serverTime: string;
  readonly data?: unknown;
  readonly code?: string;
  readonly message?: string;
}
export class MachineClient {
  clockSkewMs = 0;
  constructor(readonly env: BridgeEnv) {}
  async post(pathname: string, payload: unknown): Promise<MachineEnvelope> {
    const signed = signMachineRequest({
      env: this.env,
      pathname,
      payload,
      clockSkewMs: this.clockSkewMs,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.env.ZAVLIO_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL(pathname, this.env.ZAVLIO_CONTROL_PLANE_URL), {
        method: 'POST',
        headers: signed.headers,
        body: signed.body,
        redirect: 'error',
        signal: controller.signal,
      });
      const value = (await response.json()) as MachineEnvelope;
      if (!response.ok || !value.ok)
        throw Object.assign(new Error(value.message ?? 'Machine request failed'), {
          code: value.code ?? 'MACHINE_REQUEST_FAILED',
          status: response.status,
        });
      return value;
    } finally {
      clearTimeout(timer);
    }
  }
}
