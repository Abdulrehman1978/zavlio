export type StaffRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export function roleCanInvite(actor: StaffRole, target: StaffRole): boolean {
  if (actor === 'OWNER') return true;
  if (actor === 'ADMIN') return target === 'OPERATOR' || target === 'VIEWER';
  return false;
}
