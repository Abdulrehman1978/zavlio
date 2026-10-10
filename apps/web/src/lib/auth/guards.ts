import 'server-only';

import { AppError } from '@zavlio/config';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../supabase/server';

import { roleSatisfies, type StaffRole } from './roles';
export { roleCanInvite, roleSatisfies, type StaffRole } from './roles';
export type StaffProfile = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthIdentity = { user: User; claims: Record<string, unknown> };
export type StaffContext = AuthIdentity & { staff: StaffProfile };

export async function getCurrentAuthIdentity(): Promise<AuthIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  return { user: userData.user, claims: data.claims as Record<string, unknown> };
}

export async function getCurrentStaff(): Promise<StaffContext | null> {
  const identity = await getCurrentAuthIdentity();
  if (!identity) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id,auth_user_id,name,email,role,active,created_at,updated_at')
    .eq('auth_user_id', identity.user.id)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  return { ...identity, staff: data as StaffProfile };
}

export async function requireStaff(): Promise<StaffContext> {
  const identity = await getCurrentAuthIdentity();
  if (!identity)
    throw new AppError({
      code: 'AUTH_REQUIRED',
      message: 'Authentication is required.',
      status: 401,
    });
  const staff = await getCurrentStaff();
  if (!staff)
    throw new AppError({
      code: 'FORBIDDEN',
      message: 'Active staff authorization is required.',
      status: 403,
    });
  return staff;
}

export async function requireRole(...roles: StaffRole[]): Promise<StaffContext> {
  const staff = await requireStaff();
  if (!roles.includes(staff.staff.role)) {
    throw new AppError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to perform this action.',
      status: 403,
    });
  }
  return staff;
}

export async function requireMinimumRole(role: StaffRole): Promise<StaffContext> {
  const staff = await requireStaff();
  if (!roleSatisfies(staff.staff.role, role)) {
    throw new AppError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to perform this action.',
      status: 403,
    });
  }
  return staff;
}
