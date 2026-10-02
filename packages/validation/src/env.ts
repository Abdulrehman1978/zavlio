import { z } from 'zod';
import { assertProductionEnv } from './production';

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);
const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());
const booleanString = z.preprocess(
  (value) => value ?? 'false',
  z.enum(['true', 'false']).transform((v) => v === 'true'),
);
const numericEnv = (fallback: number, minimum = 0, maximum?: number) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? fallback : Number(value)),
    maximum === undefined
      ? z.number().int().min(minimum)
      : z.number().int().min(minimum).max(maximum),
  );

const publicEnvSchema = z.object({
  NEXT_PUBLIC_ENABLE_PORTAL: booleanString,
  NEXT_PUBLIC_ANALYTICS_ENABLED: booleanString,
  NEXT_PUBLIC_ANALYTICS_DEBUG: booleanString,
  NEXT_PUBLIC_ANALYTICS_POLICY_VERSION: z.preprocess(
    (value) => value ?? '2026-09-v1',
    z.string().min(1).max(64),
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess((value) => value ?? 'http://localhost:3000', z.url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_PROJECT_ID: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  ZOHO_SMTP_HOST: optionalString,
  ZOHO_SMTP_PORT: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : Number(value)),
    z.number().int().positive().optional(),
  ),
  ZOHO_SMTP_USER: optionalString,
  ZOHO_SMTP_PASSWORD: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: numericEnv(25, 1, 65535),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_SECURE: booleanString,
  MAILPIT_URL: optionalUrl,
  LEAD_NOTIFICATION_RECIPIENTS: z.preprocess(
    (value) => (value === '' || value === undefined ? 'hello@zavlio.online' : value),
    z.string().min(1),
  ),
  MAIL_FROM: z.preprocess(
    (value) => (value === '' || value === undefined ? 'hello@zavlio.online' : value),
    z.string().min(1),
  ),
  TURNSTILE_SECRET_KEY: optionalString,
  TURNSTILE_ENABLED: booleanString,
  LEAD_TASK_SLA_HOURS: numericEnv(24, 1, 168),
  FORM_RATE_LIMIT_PER_MINUTE: numericEnv(10, 1, 120),
  FORM_BODY_MAX_BYTES: numericEnv(32 * 1024, 1024, 64 * 1024),
  AUTOMATION_AGENT_ID: optionalString,
  AUTOMATION_HMAC_SECRET: optionalString,
  META_AUTOMATION_ENABLED: booleanString,
  META_AUTOMATION_APPROVAL_REQUIRED: booleanString,
  CONTENT_MODE: z.enum(['demo', 'production']).default('demo'),
  SENTRY_DSN: optionalUrl,
  ANALYTICS_VISITOR_TTL_DAYS: z.preprocess(
    (value) => (value === '' || value === undefined ? 180 : Number(value)),
    z.number().int().positive(),
  ),
  ANALYTICS_SESSION_TIMEOUT_MINUTES: z.preprocess(
    (value) => (value === '' || value === undefined ? 30 : Number(value)),
    z.number().int().positive(),
  ),
  ANALYTICS_BATCH_MAX: z.preprocess(
    (value) => (value === '' || value === undefined ? 20 : Number(value)),
    z.number().int().min(1).max(20),
  ),
  CRM_ANALYTICS_DEFAULT_RANGE_DAYS: numericEnv(30, 1, 730),
  CRM_ANALYTICS_MAX_RANGE_DAYS: numericEnv(730, 1, 3660),
  CRM_ANALYTICS_SLOW_QUERY_MS: numericEnv(500, 1, 60_000),
  ANALYTICS_POLICY_VERSION: z.preprocess(
    (value) => value ?? '2026-09-v1',
    z.string().min(1).max(64),
  ),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export function parsePublicEnv(input: Record<string, unknown>): PublicEnv {
  return publicEnvSchema.parse(input);
}
export function parseServerEnv(input: Record<string, unknown>): ServerEnv {
  const parsed = serverEnvSchema.parse(input);
  if (parsed.NODE_ENV === 'production' && input.NEXT_PHASE !== 'phase-production-build')
    assertProductionEnv(input);
  return parsed;
}

export function requireIntegrationEnv(
  env: ServerEnv,
  integration: 'automation' | 'email' | 'supabase' | 'turnstile',
): void {
  const required: Record<typeof integration, Array<keyof ServerEnv>> = {
    automation: ['AUTOMATION_AGENT_ID', 'AUTOMATION_HMAC_SECRET'],
    email: [
      'ZOHO_SMTP_HOST',
      'ZOHO_SMTP_PORT',
      'ZOHO_SMTP_USER',
      'ZOHO_SMTP_PASSWORD',
      'MAIL_FROM',
    ],
    supabase: ['SUPABASE_SERVICE_ROLE_KEY'],
    turnstile: ['TURNSTILE_SECRET_KEY'],
  };
  const missing = required[integration].filter((key) => env[key] === undefined);
  if (missing.length > 0)
    throw new Error(`Missing ${integration} environment variables: ${missing.join(', ')}`);
}
