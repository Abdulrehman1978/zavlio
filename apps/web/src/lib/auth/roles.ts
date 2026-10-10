export type StaffRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export const ROLE_RANK: Record<StaffRole, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function roleSatisfies(actual: StaffRole, required: StaffRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export function roleCanInvite(actor: StaffRole, target: StaffRole): boolean {
  if (actor === 'OWNER') return true;
  if (actor === 'ADMIN') return target === 'OPERATOR' || target === 'VIEWER';
  return false;
}
