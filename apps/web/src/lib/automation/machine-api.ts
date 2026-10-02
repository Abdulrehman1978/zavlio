import 'server-only';
import {
  intersectCapabilities,
  PACKET_15_CAPABILITIES,
  type MachineCapabilities,
} from '@zavlio/automation/protocol';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import type { z } from 'zod';
import {
  MachineProtocolError,
  verifyMachineRequest,
  type VerifiedMachineRequest,
} from './machine-auth';

const headers = {
  'cache-control': 'no-store, private',
  'content-type': 'application/json',
  vary: 'X-Zavlio-Agent-Key, X-Zavlio-Key-Id',
};
function response(
  ok: boolean,
  status: number,
  requestId: string,
  dataOrCode: unknown,
  message?: string,
) {
  const body = ok
    ? {
        ok: true,
        protocolVersion: 1,
        requestId,
        serverTime: new Date().toISOString(),
        data: dataOrCode,
      }
    : {
        ok: false,
        code: dataOrCode,
        message: message ?? 'Machine request rejected.',
        requestId,
        serverTime: new Date().toISOString(),
      };
  return new Response(JSON.stringify(body), { status, headers });
}
function mapDatabaseError(message: string) {
  if (message.includes('IDEMPOTENCY_CONFLICT'))
    return new MachineProtocolError(409, 'IDEMPOTENCY_CONFLICT');
  if (message.includes('LEASE_LOST')) return new MachineProtocolError(409, 'LEASE_LOST');
  if (message.includes('JOB_STATE_CONFLICT'))
    return new MachineProtocolError(409, 'JOB_STATE_CONFLICT');
  if (message.includes('disabled')) return new MachineProtocolError(403, 'AGENT_DISABLED');
  return new MachineProtocolError(409, 'JOB_STATE_CONFLICT');
}
export async function machineMutation<T extends z.ZodType>(
  request: Request,
  schema: T,
  handler: (body: z.infer<T>, principal: VerifiedMachineRequest) => Promise<unknown>,
) {
  let requestId = crypto.randomUUID();
  try {
    const principal = await verifyMachineRequest(request);
    requestId = principal.requestId;
    let value: unknown;
    try {
      value = JSON.parse(principal.rawBody);
    } catch {
      throw new MachineProtocolError(400, 'PROTOCOL_INVALID_BODY');
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new MachineProtocolError(400, 'PROTOCOL_INVALID_BODY');
    return response(true, 200, requestId, await handler(parsed.data, principal));
  } catch (error) {
    const e =
      error instanceof MachineProtocolError
        ? error
        : new MachineProtocolError(500, 'INTERNAL_ERROR');
    return response(false, e.status, requestId, e.code, e.message);
  }
}
export function safeCapabilities(registered: MachineCapabilities, requested: MachineCapabilities) {
  return intersectCapabilities(
    intersectCapabilities(registered, PACKET_15_CAPABILITIES as unknown as MachineCapabilities),
    requested,
  );
}
export async function rpcJson(name: string, args: Record<string, unknown>) {
  const db = createAdminDatabaseClient();
  const result = await db.rpc(name as never, args as never);
  if (result.error) throw mapDatabaseError(result.error.message);
  return result.data as unknown;
}
export { createAdminDatabaseClient };
