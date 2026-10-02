import Link from 'next/link';
import { Shell } from '@zavlio/ui';
import { safeNextPath } from '../../../lib/auth/redirects';

type ForgotProps = { searchParams: Promise<{ next?: string; sent?: string }> };

export default async function ForgotPasswordPage({ searchParams }: ForgotProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <Shell>
      <main aria-labelledby="forgot-title">
        <h1 id="forgot-title">Reset your password</h1>
        <p>
          {params.sent === '1'
            ? 'If an eligible account exists, recovery instructions have been sent.'
            : 'Enter your invited staff email.'}
        </p>
        <form action="/api/auth/forgot-password" method="post">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="recovery-email">Email</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" required />
          <button type="submit">Send recovery email</button>
        </form>
        <Link href="/login">Back to login</Link>
      </main>
    </Shell>
  );
}
