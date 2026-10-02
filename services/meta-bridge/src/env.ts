import { assertSafeControlPlaneUrl } from '@zavlio/automation/protocol';
import { z } from 'zod';

const integer = (fallback: number, min: number, max: number) =>
  z.preprocess(
    (v) => (v === undefined || v === '' ? fallback : Number(v)),
    z.number().int().min(min).max(max),
  );
const bridgeEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  META_BRIDGE_HOST: z
    .string()
    .default('127.0.0.1')
    .refine((v) => v === '127.0.0.1' || v === 'localhost'),
  META_BRIDGE_PORT: integer(4010, 1, 65535),
  ZAVLIO_CONTROL_PLANE_URL: z.url(),
  ZAVLIO_AGENT_KEY: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,99}$/i),
  ZAVLIO_MACHINE_KEY_ID: z.string().min(1).max(100),
  ZAVLIO_MACHINE_HMAC_SECRET: z
    .string()
    .min(43)
    .refine((v) => Buffer.from(v, 'base64url').length >= 32),
  ZAVLIO_BRIDGE_VERSION: z.string().min(1).max(100).default('0.0.0'),
  ZAVLIO_PROTOCOL_VERSION: z.preprocess(
    (v) => v ?? '1',
    z.coerce
      .number()
      .int()
      .refine((v) => v === 1),
  ),
  ZAVLIO_EXECUTOR_MODE: z.literal('DRY_RUN_ONLY').default('DRY_RUN_ONLY'),
  ZAVLIO_HEARTBEAT_INTERVAL_MS: integer(30000, 5000, 300000),
  ZAVLIO_POLL_INTERVAL_MS: integer(5000, 1000, 300000),
  ZAVLIO_REQUEST_TIMEOUT_MS: integer(10000, 1000, 30000),
  ZAVLIO_MAX_CONCURRENCY: z.preprocess(
    (v) => v ?? '1',
    z.coerce
      .number()
      .int()
      .refine((v) => v === 1),
  ),
  ZAVLIO_META_ADAPTER_ENABLED: z
    .preprocess((v) => v === true || v === 'true', z.boolean())
    .default(false),
  ZAVLIO_META_ADAPTER_UPSTREAM_ROOT: z.string().default('external/meta-automation'),
  ZAVLIO_META_ADAPTER_RUNTIME_DIR: z.string().default('.runtime/meta-automation'),
  ZAVLIO_META_ADAPTER_CDP_URL: z.string().default('http://127.0.0.1:9222'),
  ZAVLIO_META_ADAPTER_TEST_MODE: z
    .preprocess((v) => v === true || v === 'true', z.boolean())
    .default(false),
  ZAVLIO_META_ADAPTER_REQUEST_TIMEOUT_MS: integer(15000, 1000, 120000),
  ZAVLIO_META_ADAPTER_VERSION: z.string().min(1).max(100).default('15.0.0'),
});
export type BridgeEnv = z.infer<typeof bridgeEnvSchema>;
export function parseBridgeEnv(input: Record<string, unknown>): BridgeEnv {
  const env = bridgeEnvSchema.parse(input);
  assertSafeControlPlaneUrl(env.ZAVLIO_CONTROL_PLANE_URL, env.NODE_ENV === 'production');
  if ('SUPABASE_SERVICE_ROLE_KEY' in input && input.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Meta Bridge must not receive a Supabase service-role key.');
  if (env.ZAVLIO_META_ADAPTER_ENABLED) {
    const cdp = new URL(env.ZAVLIO_META_ADAPTER_CDP_URL);
    if (!['127.0.0.1', 'localhost', '::1'].includes(cdp.hostname))
      throw new Error('Meta adapter CDP must remain local.');
    if (env.ZAVLIO_META_ADAPTER_TEST_MODE && env.NODE_ENV === 'production')
      throw new Error('Meta adapter test mode is not allowed in production.');
  }
  return env;
}
