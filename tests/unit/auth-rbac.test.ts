import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { roleCanInvite } from '../../apps/web/src/lib/auth/roles';
import { safeNextPath } from '../../apps/web/src/lib/auth/redirects';

describe('Packet 07 auth boundaries', () => {
  it('allows only internal safe redirects', () => {
    expect(safeNextPath('/crm')).toBe('/crm');
    expect(safeNextPath('/auth/set-password')).toBe('/auth/set-password');
    expect(safeNextPath('https://evil.example')).toBe('/crm');
    expect(safeNextPath('//evil.example')).toBe('/crm');
    expect(safeNextPath('/settings')).toBe('/crm');
  });

  it('enforces invite hierarchy', () => {
    expect(roleCanInvite('OWNER', 'OWNER')).toBe(true);
    expect(roleCanInvite('OWNER', 'ADMIN')).toBe(true);
    expect(roleCanInvite('ADMIN', 'OPERATOR')).toBe(true);
    expect(roleCanInvite('ADMIN', 'VIEWER')).toBe(true);
    expect(roleCanInvite('ADMIN', 'ADMIN')).toBe(false);
    expect(roleCanInvite('ADMIN', 'OWNER')).toBe(false);
    expect(roleCanInvite('OPERATOR', 'VIEWER')).toBe(false);
  });

  it('keeps server auth on claims and out of session shortcuts', async () => {
    const fs = await import('node:fs/promises');
    const source = await fs.readFile(
      path.resolve(process.cwd(), 'apps/web/src/lib/auth/guards.ts'),
      'utf8',
    );
    expect(source).toContain('auth.getClaims()');
    expect(source).not.toContain('auth.getSession()');
  });
});
