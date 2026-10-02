import { describe, expect, it } from 'vitest';
import {
  contactPayloadSchema,
  deriveDisplayName,
  isFreeEmailDomain,
  normalizeWebsiteDomain,
  startProjectPayloadSchema,
} from '@zavlio/validation';

describe('Packet 09 lead intake contracts', () => {
  it('normalizes safe website domains without path/query data', () => {
    expect(normalizeWebsiteDomain('https://www.Example.test/path?token=secret')).toBe(
      'example.test',
    );
    expect(normalizeWebsiteDomain('mailto:person@example.test')).toBeUndefined();
    expect(isFreeEmailDomain('person@gmail.com')).toBe(true);
    expect(isFreeEmailDomain('person@example.test')).toBe(false);
  });

  it('keeps human names conservative', () => {
    expect(deriveDisplayName('Mary Jane Watson')).toEqual({
      displayName: 'Mary Jane Watson',
      firstName: 'Mary',
      lastName: 'Jane Watson',
    });
  });

  it('validates stable project keys and bounded free text', () => {
    const result = startProjectPayloadSchema.safeParse({
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      formVersion: 'START_PROJECT_V1',
      name: 'A Lead',
      email: 'A.LEAD@example.test',
      services: ['website'],
      goal: 'Launch a useful public website for our next product.',
      budget: 'INR_3_7_LAKH',
      timing: 'ONE_TO_TWO_MONTHS',
      source: 'REFERRAL',
      honeypot: '',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('a.lead@example.test');
    expect(
      contactPayloadSchema.safeParse({
        idempotencyKey: '00000000-0000-4000-8000-000000000002',
        formVersion: 'CONTACT_V1',
        name: 'A Lead',
        email: 'lead@example.test',
        message: 'Hello Zavlio',
      }).success,
    ).toBe(true);
  });
});
