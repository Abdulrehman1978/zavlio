import { describe, expect, it } from 'vitest';
import {
  parsePublicEnv,
  parseServerEnv,
  requireIntegrationEnv,
} from '../../packages/validation/src/env';

describe('environment validation', () => {
  it('uses safe local defaults without requiring future integrations', () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000');
    expect(parseServerEnv({}).CONTENT_MODE).toBe('demo');
  });
  it('rejects malformed public URLs', () =>
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: 'bad' })).toThrow());
  it('requires secrets only when an integration is enabled', () => {
    expect(() => requireIntegrationEnv(parseServerEnv({}), 'automation')).toThrow(
      /AUTOMATION_HMAC_SECRET/,
    );
  });
  it('does not return server secrets from the public schema', () => {
    expect(
      'SUPABASE_SERVICE_ROLE_KEY' in parsePublicEnv({ SUPABASE_SERVICE_ROLE_KEY: 'secret' }),
    ).toBe(false);
  });
});
