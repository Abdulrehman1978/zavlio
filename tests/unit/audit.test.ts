import { describe, expect, it } from 'vitest';
import { redactAuditPayload } from '../../apps/web/src/lib/crm/audit-data';

describe('CRM Audit Log Redaction & Security', () => {
  it('redacts sensitive keys including passwords, tokens, secrets, hmac, cookies', () => {
    const rawPayload = {
      username: 'alice_operator',
      password: 'super-secret-password-123',
      session_token: 'tok_abc123456789',
      api_key: 'sk_live_1234567890abcdef',
      hmacSecret: 'hmac_key_999',
      cookieHeader: 'sb-auth-token=xyz',
      safeDetail: 'Updated profile role to OPERATOR',
      nested: {
        accessToken: 'jwt.token.value',
        targetId: '55555555-5555-4555-8555-555555555555',
      },
    };

    const redacted = redactAuditPayload(rawPayload) as Record<string, unknown>;

    expect(redacted.username).toBe('alice_operator');
    expect(redacted.safeDetail).toBe('Updated profile role to OPERATOR');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.session_token).toBe('[REDACTED]');
    expect(redacted.api_key).toBe('[REDACTED]');
    expect(redacted.hmacSecret).toBe('[REDACTED]');
    expect(redacted.cookieHeader).toBe('[REDACTED]');

    const nested = redacted.nested as Record<string, unknown>;
    expect(nested.accessToken).toBe('[REDACTED]');
    expect(nested.targetId).toBe('55555555-5555-4555-8555-555555555555');
  });

  it('handles null, primitive, and array values safely', () => {
    expect(redactAuditPayload(null)).toBe(null);
    expect(redactAuditPayload('string value')).toBe('string value');
    expect(redactAuditPayload(42)).toBe(42);

    const arrayPayload = [
      { key: 'safe', value: 'hello' },
      { key: 'secret_token', value: '123' },
    ];
    const redactedArray = redactAuditPayload(arrayPayload) as Array<Record<string, unknown>>;
    expect(redactedArray[0].value).toBe('hello');
    expect(redactedArray[1].value).toBe('123'); // key is "key", not sensitive pattern
  });
});
