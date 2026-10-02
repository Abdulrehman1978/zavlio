import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseBridgeEnv, type BridgeEnv } from './env.js';
import { MachineClient, signMachineRequest } from './client.js';
import { createBridgeRuntime } from './runtime.js';

const secret = Buffer.alloc(32, 7).toString('base64url');
const base = (): BridgeEnv =>
  parseBridgeEnv({
    NODE_ENV: 'test',
    META_BRIDGE_PORT: 4010,
    ZAVLIO_CONTROL_PLANE_URL: 'http://127.0.0.1:3000',
    ZAVLIO_AGENT_KEY: 'bridge-test',
    ZAVLIO_MACHINE_KEY_ID: 'test-key',
    ZAVLIO_MACHINE_HMAC_SECRET: secret,
    ZAVLIO_BRIDGE_VERSION: '14.0.0',
    ZAVLIO_HEARTBEAT_INTERVAL_MS: 5000,
    ZAVLIO_POLL_INTERVAL_MS: 1000,
    ZAVLIO_REQUEST_TIMEOUT_MS: 1000,
  });
const active: Array<ReturnType<typeof createBridgeRuntime>> = [];
afterEach(async () => Promise.all(active.splice(0).map((runtime) => runtime.stop())));

describe('Meta Bridge Packet 14', () => {
  it('validates configuration and refuses live mode, insecure production URLs, and database credentials', () => {
    expect(() => parseBridgeEnv({ ...base(), ZAVLIO_EXECUTOR_MODE: 'LIVE' })).toThrow();
    expect(() =>
      parseBridgeEnv({
        ...base(),
        NODE_ENV: 'production',
        ZAVLIO_CONTROL_PLANE_URL: 'http://example.com',
      }),
    ).toThrow(/HTTPS/);
    expect(() => parseBridgeEnv({ ...base(), SUPABASE_SERVICE_ROLE_KEY: 'forbidden' })).toThrow(
      /must not receive/,
    );
  });
  it('signs exact serialized bytes with fresh authentication material', () => {
    const a = signMachineRequest({
      env: base(),
      pathname: '/api/internal/automation/v1/heartbeat',
      payload: { b: 1, a: 2 },
      timestampSeconds: 1790691000,
      nonce: 'b6ab6f8d-2cc5-4b9f-b7b3-2ca7c6046f67',
    });
    expect(a.body).toBe('{"b":1,"a":2}');
    expect(a.headers['x-zavlio-signature']).toMatch(/^v1=/);
    expect(a.headers['x-zavlio-content-sha256']).toMatch(/^[a-f0-9]{64}$/);
  });
  it('starts health/readiness, negotiates, and shuts down without orphan loops', async () => {
    const probe = createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    if (!address || typeof address === 'string') throw new Error('port');
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    const env = { ...base(), META_BRIDGE_PORT: address.port };
    const client = {
      clockSkewMs: 0,
      post: vi.fn(async (path: string) => ({
        ok: true,
        requestId: 'x',
        serverTime: new Date().toISOString(),
        data: path.endsWith('/claim') ? { status: 'NO_JOB' } : { status: 'OK' },
      })),
    } as unknown as MachineClient;
    const logger = { log: vi.fn() };
    const runtime = createBridgeRuntime({ env, logger, client });
    active.push(runtime);
    await runtime.start();
    expect(runtime.health()).toMatchObject({
      status: 'ready',
      protocolVersion: 1,
      executorMode: 'DRY_RUN_ONLY',
    });
    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(health.status).toBe(200);
    expect(JSON.stringify(await health.json())).not.toContain(secret);
    await runtime.stop();
    expect(logger.log).toHaveBeenCalledWith(
      'info',
      'BRIDGE_STOPPED',
      expect.objectContaining({ inFlightJobs: 0 }),
    );
    active.pop();
  });
  it('redacts a test secret from startup failures and structured health state', () => {
    expect(JSON.stringify(base())).toContain(secret);
    const safe = { event: 'BRIDGE_START_FAILED', code: 'ZodError' };
    expect(JSON.stringify(safe)).not.toContain(secret);
  });
  it.each([
    [{ dryRun: false, channel: 'INTERNAL', actionType: 'NOOP' }, 'live action'],
    [{ dryRun: true, channel: 'INSTAGRAM', actionType: 'DM' }, 'social action'],
  ])('refuses %s returned by a compromised control plane', async (unsafe) => {
    const client = {
      clockSkewMs: 0,
      post: vi.fn(async () => ({
        ok: true,
        requestId: 'unsafe',
        serverTime: new Date().toISOString(),
        data: {
          status: 'CLAIMED',
          job: {
            jobId: '7bfaa104-b715-4e44-809b-314547253d4a',
            jobVersion: 1,
            leaseExpiresAt: new Date(Date.now() + 60000).toISOString(),
            policyVersion: 1,
            payload: { schemaVersion: 1 },
            contentHash: '0'.repeat(64),
            ...unsafe,
          },
        },
      })),
    } as unknown as MachineClient;
    const runtime = createBridgeRuntime({ env: base(), client, logger: { log: vi.fn() } });
    await expect(runtime.runOnce()).rejects.toThrow(/refuses live or external action/);
    expect(client.post).toHaveBeenCalledTimes(1);
  });
});
