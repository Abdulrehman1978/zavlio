import { redirect } from 'next/navigation';
import { Shell } from '@zavlio/ui';
import { requireRole, type StaffRole } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const roles: StaffRole[] = ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'];

export default async function StaffSettingsPage() {
  let context;
  try {
    context = await requireRole('OWNER', 'ADMIN');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'AUTH_REQUIRED')
      redirect('/login?next=/crm/settings/staff');
    redirect('/auth/error?code=forbidden');
  }
  const supabase = await createServerSupabaseClient();
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id,name,email,role,active,created_at')
    .order('created_at', { ascending: true });
  const manageableRoles = context.staff.role === 'OWNER' ? roles : ['OPERATOR', 'VIEWER'];
  return (
    <Shell>
      <main aria-labelledby="staff-title">
        <p>
          <a href="/crm">← Back to CRM</a>
        </p>
        <h1 id="staff-title">Staff administration</h1>
        <p>Invite and manage authorized Zavlio staff.</p>
        <section aria-labelledby="invite-title">
          <h2 id="invite-title">Invite staff</h2>
          <form action="/api/staff/invite" method="post">
            <label>
              Email <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Name <input name="name" required autoComplete="name" />
            </label>
            <label>
              Role{' '}
              <select name="role" defaultValue="VIEWER">
                {manageableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Send invite</button>
          </form>
        </section>
        <section aria-labelledby="list-title">
          <h2 id="list-title">Current staff</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td>{member.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    {member.id !== context.staff.id && (
                      <>
                        <form action={`/api/staff/${member.id}`} method="post">
                          <input type="hidden" name="action" value="role" />
                          <select name="role" defaultValue={member.role}>
                            {manageableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button type="submit">Save role</button>
                        </form>
                        <form action={`/api/staff/${member.id}`} method="post">
                          <input
                            type="hidden"
                            name="action"
                            value={member.active ? 'deactivate' : 'activate'}
                          />
                          <button type="submit">{member.active ? 'Deactivate' : 'Activate'}</button>
                        </form>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </Shell>
  );
}
