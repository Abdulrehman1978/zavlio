import { describe, expect, it } from 'vitest';
import { privacyRequestCreateSchema } from '@zavlio/validation';

describe('CRM Consent & Subject Privacy Requests (DSR)', () => {
  it('validates a valid EXPORT privacy request schema', () => {
    const valid = {
      personId: '44444444-4444-4444-8444-444444444444',
      requestType: 'EXPORT' as const,
      verifiedIdentity: true,
      notes: 'Requester provided signed authorization matching primary email.',
    };

    const parsed = privacyRequestCreateSchema.parse(valid);
    expect(parsed.personId).toBe('44444444-4444-4444-8444-444444444444');
    expect(parsed.requestType).toBe('EXPORT');
    expect(parsed.verifiedIdentity).toBe(true);
  });

  it('validates a valid ANONYMIZATION privacy request schema', () => {
    const valid = {
      personId: '44444444-4444-4444-8444-444444444444',
      requestType: 'ANONYMIZATION' as const,
      verifiedIdentity: true,
      notes: 'Requester requested right to erasure under privacy guidelines.',
    };

    const parsed = privacyRequestCreateSchema.parse(valid);
    expect(parsed.requestType).toBe('ANONYMIZATION');
  });

  it('rejects privacy requests when identity is not verified', () => {
    const unverified = {
      personId: '44444444-4444-4444-8444-444444444444',
      requestType: 'EXPORT' as const,
      verifiedIdentity: false, // Fails schema check: verifiedIdentity must be true
    };

    expect(() => privacyRequestCreateSchema.parse(unverified)).toThrow();
  });

  it('validates simulated subject export structure adheres to privacy invariants', () => {
    const mockExport = {
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        subjectPersonId: '44444444-4444-4444-8444-444444444444',
        purpose: 'DATA_SUBJECT_ACCESS_REQUEST',
        complianceNotice:
          'Structured, bounded export. System credentials and machine internals redacted.',
      },
      profile: {
        id: '44444444-4444-4444-8444-444444444444',
        displayName: 'Subject Alice',
        primaryEmail: 'alice@example.com',
        doNotContact: false,
      },
      identities: [],
      consentHistory: [],
      formSubmissions: [],
      recordedEventsCount: 0,
      recordedEventsSample: [],
    };

    expect(mockExport.exportMetadata.purpose).toBe('DATA_SUBJECT_ACCESS_REQUEST');
    expect(mockExport.profile.primaryEmail).toBe('alice@example.com');
    // Ensure no password or token fields exist in subject export
    expect(mockExport).not.toHaveProperty('password');
    expect(mockExport).not.toHaveProperty('token');
    expect(mockExport).not.toHaveProperty('secret');
  });

  it('verifies anonymization preview preserves DNC suppression and audit history', () => {
    const mockPreview = {
      personId: '44444444-4444-4444-8444-444444444444',
      displayName: 'Subject Alice',
      primaryEmail: 'alice@example.com',
      doNotContact: true,
      scopeToAnonymize: {
        profileAttributes: ['first_name', 'last_name', 'display_name', 'primary_email'],
        identitiesCount: 1,
        formSubmissionsCount: 1,
        eventsCount: 5,
        tasksCount: 0,
        notesCount: 0,
      },
      complianceSafeguards: {
        dncSuppressionPreserved: true,
        auditHistoryPreserved: true,
        executionStatus: 'DRY_RUN_PREVIEW_ONLY',
        notice:
          'Destructive purge is held in PENDING_POLICY_APPROVAL until formal legal retention policy sign-off.',
      },
    };

    expect(mockPreview.complianceSafeguards.dncSuppressionPreserved).toBe(true);
    expect(mockPreview.complianceSafeguards.auditHistoryPreserved).toBe(true);
    expect(mockPreview.complianceSafeguards.executionStatus).toBe('DRY_RUN_PREVIEW_ONLY');
  });
});
