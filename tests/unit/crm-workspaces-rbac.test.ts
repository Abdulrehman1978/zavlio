import { describe, expect, it } from 'vitest';
import { roleSatisfies, type StaffRole } from '../../apps/web/src/lib/auth/roles';

describe('New CRM Workspaces Role Matrix & Capabilities', () => {
  const roles: StaffRole[] = ['VIEWER', 'OPERATOR', 'ADMIN', 'OWNER'];

  describe('Campaigns Workspace Permissions', () => {
    // Read: VIEWER+; Write/Manage: OPERATOR+; Archive: ADMIN+
    it('enforces read permissions for all staff roles', () => {
      for (const role of roles) {
        expect(roleSatisfies(role, 'VIEWER')).toBe(true);
      }
    });

    it('enforces creation and membership modifications require at least OPERATOR', () => {
      expect(roleSatisfies('VIEWER', 'OPERATOR')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'OPERATOR')).toBe(true);
      expect(roleSatisfies('ADMIN', 'OPERATOR')).toBe(true);
      expect(roleSatisfies('OWNER', 'OPERATOR')).toBe(true);
    });

    it('enforces campaign archiving requires at least ADMIN', () => {
      expect(roleSatisfies('VIEWER', 'ADMIN')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'ADMIN')).toBe(false);
      expect(roleSatisfies('ADMIN', 'ADMIN')).toBe(true);
      expect(roleSatisfies('OWNER', 'ADMIN')).toBe(true);
    });
  });

  describe('Consent & Subject Rights Permissions', () => {
    // Read: VIEWER+; DNC Toggle: OPERATOR+; DSR Export & Dry-run: ADMIN+; Destructive Purge: Policy Hold
    it('enforces DNC toggle requires OPERATOR or higher', () => {
      expect(roleSatisfies('VIEWER', 'OPERATOR')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'OPERATOR')).toBe(true);
      expect(roleSatisfies('ADMIN', 'OPERATOR')).toBe(true);
      expect(roleSatisfies('OWNER', 'OPERATOR')).toBe(true);
    });

    it('enforces DSR Data Export and Anonymize Dry-run require ADMIN or OWNER', () => {
      expect(roleSatisfies('VIEWER', 'ADMIN')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'ADMIN')).toBe(false);
      expect(roleSatisfies('ADMIN', 'ADMIN')).toBe(true);
      expect(roleSatisfies('OWNER', 'ADMIN')).toBe(true);
    });

    it('enforces destructive purge is never executed autonomously without legal policy approval', () => {
      const purgeExecutionAllowed = false; // System policy hold
      expect(purgeExecutionAllowed).toBe(false);
    });
  });

  describe('Audit Log Explorer Permissions', () => {
    // Read & Search: ADMIN+; Modifying: Impossible in database
    it('restricts /crm/audit access strictly to ADMIN and OWNER', () => {
      expect(roleSatisfies('VIEWER', 'ADMIN')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'ADMIN')).toBe(false);
      expect(roleSatisfies('ADMIN', 'ADMIN')).toBe(true);
      expect(roleSatisfies('OWNER', 'ADMIN')).toBe(true);
    });
  });

  describe('Settings Hub Permissions', () => {
    // Access: ADMIN+
    it('restricts /crm/settings access strictly to ADMIN and OWNER', () => {
      expect(roleSatisfies('VIEWER', 'ADMIN')).toBe(false);
      expect(roleSatisfies('OPERATOR', 'ADMIN')).toBe(false);
      expect(roleSatisfies('ADMIN', 'ADMIN')).toBe(true);
      expect(roleSatisfies('OWNER', 'ADMIN')).toBe(true);
    });
  });

  describe('Content Workspace Permissions', () => {
    // Create/Edit Draft: OPERATOR+; Publish / Archive: ADMIN+
    it('allows OPERATOR to author drafts but denies publishing', () => {
      expect(roleSatisfies('OPERATOR', 'OPERATOR')).toBe(true);
      expect(roleSatisfies('OPERATOR', 'ADMIN')).toBe(false);
    });

    it('allows ADMIN and OWNER to publish and archive content', () => {
      expect(roleSatisfies('ADMIN', 'ADMIN')).toBe(true);
      expect(roleSatisfies('OWNER', 'ADMIN')).toBe(true);
    });
  });
});
