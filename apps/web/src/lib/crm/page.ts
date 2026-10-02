import { redirect } from 'next/navigation';
import { requireStaff, type StaffContext } from '../auth/guards';
import { requireRole } from '../auth/guards';

export async function requireCrmPage(path: string): Promise<StaffContext> {
  try {
    return await requireStaff();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'AUTH_REQUIRED')
      redirect(`/login?next=${encodeURIComponent(path)}`);
    redirect('/auth/error?code=forbidden');
  }
}

export async function requireCrmRolePage(
  path: string,
  ...roles: Parameters<typeof requireRole>
): Promise<StaffContext> {
  try {
    return await requireRole(...roles);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'AUTH_REQUIRED')
      redirect(`/login?next=${encodeURIComponent(path)}`);
    redirect('/auth/error?code=forbidden');
  }
}
