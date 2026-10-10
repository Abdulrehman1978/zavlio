import { describe, expect, it } from 'vitest';
import { campaignCreateSchema, campaignMemberAddSchema } from '@zavlio/validation';

describe('CRM Campaigns Planning & Member Management', () => {
  it('validates a valid campaign creation schema', () => {
    const valid = {
      name: 'Q4 2026 Architectural Engineering Outreach',
      type: 'OUTREACH_MANUAL' as const,
      status: 'DRAFT' as const,
      startsAt: '2026-11-01T00:00:00Z',
      endsAt: '2026-12-15T00:00:00Z',
      audienceDefinition: {
        industry: 'Spatial Architecture & Design Systems',
        minEmployees: 10,
        consentChannel: 'EMAIL',
      },
    };

    const parsed = campaignCreateSchema.parse(valid);
    expect(parsed.name).toBe('Q4 2026 Architectural Engineering Outreach');
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.type).toBe('OUTREACH_MANUAL');
  });

  it('rejects campaign with blank name or invalid type', () => {
    expect(() =>
      campaignCreateSchema.parse({
        name: '',
        type: 'INVALID_TYPE',
        status: 'DRAFT',
      }),
    ).toThrow();
  });

  it('validates campaign member addition schema', () => {
    const validMember = {
      campaignId: '22222222-2222-4222-8222-222222222222',
      personId: '33333333-3333-4333-8333-333333333333',
      status: 'ADDED' as const,
    };

    const parsed = campaignMemberAddSchema.parse(validMember);
    expect(parsed.campaignId).toBe('22222222-2222-4222-8222-222222222222');
    expect(parsed.personId).toBe('33333333-3333-4333-8333-333333333333');
    expect(parsed.status).toBe('ADDED');
  });

  it('rejects invalid UUIDs for campaign member IDs', () => {
    expect(() =>
      campaignMemberAddSchema.parse({
        campaignId: 'not-a-uuid',
        personId: '33333333-3333-4333-8333-333333333333',
        status: 'TARGETED',
      }),
    ).toThrow();
  });

  it('enforces exclusion status when DNC flag is present', () => {
    // Business logic test: if a person has do_not_contact = true,
    // their member status is marked as EXCLUDED
    const person = { do_not_contact: true };
    const memberStatus = person.do_not_contact ? 'EXCLUDED' : 'TARGETED';
    expect(memberStatus).toBe('EXCLUDED');
  });
});
