import { describe, expect, it } from 'vitest';
import {
  crmDncSchema,
  crmNoteSchema,
  crmPersonPatchSchema,
  identityCandidateRejectSchema,
  personMergeSchema,
} from '@zavlio/validation';

describe('Packet 10 CRM contracts', () => {
  it('rejects unsafe or overlong CRM mutations', () => {
    const unsafePerson = crmPersonPatchSchema.safeParse({ primaryEmail: 'new@example.com' });
    expect(unsafePerson.success).toBe(true);
    if (unsafePerson.success) expect(unsafePerson.data).not.toHaveProperty('primaryEmail');
    expect(crmNoteSchema.safeParse({ body: '' }).success).toBe(false);
    expect(crmDncSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(identityCandidateRejectSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(personMergeSchema.safeParse({ targetPersonId: 'not-a-uuid' }).success).toBe(false);
  });

  it('accepts the explicitly scoped safe CRM fields', () => {
    expect(
      crmPersonPatchSchema.safeParse({
        displayName: 'Ada Lovelace',
        jobTitle: 'Researcher',
        primaryPhone: '+1 555 0100',
        organizationId: null,
      }).success,
    ).toBe(true);
    expect(crmNoteSchema.safeParse({ body: 'Follow up next week' }).success).toBe(true);
    expect(crmDncSchema.safeParse({ reason: 'Requested by contact' }).success).toBe(true);
  });
});
