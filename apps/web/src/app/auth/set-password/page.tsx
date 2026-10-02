import { redirect } from 'next/navigation';
import { Shell } from '@zavlio/ui';
import { getCurrentAuthIdentity } from '../../../lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function SetPasswordPage() {
  const identity = await getCurrentAuthIdentity();
  if (!identity) redirect('/login?next=/auth/set-password');
  return (
    <Shell>
      <main aria-labelledby="set-password-title">
        <h1 id="set-password-title">Set your staff password</h1>
        <p>Use at least 12 characters. Passphrases are supported.</p>
        <form action="/api/auth/set-password" method="post">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
          <label htmlFor="password-confirmation">Confirm password</label>
          <input
            id="password-confirmation"
            name="password_confirmation"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
          <button type="submit">Save password</button>
        </form>
      </main>
    </Shell>
  );
}
