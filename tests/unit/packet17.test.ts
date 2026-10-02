import { describe, expect, it } from 'vitest';
import { redactLogContext } from '../../packages/config/src/logging';
import {
  assertProductionEnv,
  productionEnvironmentIssues,
} from '../../packages/validation/src/production';

const validProduction = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://app.example.test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_PROJECT_ID: 'project',
  SUPABASE_SERVICE_ROLE_KEY: 'server-key',
  SMTP_HOST: 'smtp.example.test',
  SMTP_USER: 'mailer',
  SMTP_PASSWORD: 'random-secret',
  MAIL_FROM: 'hello@example.test',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
  TURNSTILE_ENABLED: 'true',
  SMTP_SECURE: 'true',
  CONTENT_MODE: 'production',
  META_AUTOMATION_ENABLED: 'false',
  META_AUTOMATION_APPROVAL_REQUIRED: 'true',
};

describe('Packet 17 production safety', () => {
  it('accepts a complete non-local production contract', () => {
    expect(productionEnvironmentIssues(validProduction)).toEqual([]);
    expect(() => assertProductionEnv(validProduction)).not.toThrow();
  });

  it('rejects unsafe development defaults in production', () => {
    const issues = productionEnvironmentIssues({
      ...validProduction,
      CONTENT_MODE: 'demo',
      TURNSTILE_ENABLED: 'false',
      SMTP_HOST: '127.0.0.1',
      SMTP_SECURE: 'false',
      MAILPIT_URL: 'http://127.0.0.1:54324',
    });
    expect(issues.map(({ variable }) => variable)).toEqual(
      expect.arrayContaining(['CONTENT_MODE', 'TURNSTILE_ENABLED', 'SMTP_HOST', 'SMTP_SECURE']),
    );
  });

  it('redacts sensitive keys and token-shaped values recursively', () => {
    const redacted = redactLogContext({
      requestId: 'req-1',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature',
      nested: JSON.stringify({ cookie: 'session=secret' }),
    });
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.requestId).toBe('req-1');
  });
});
