import Link from 'next/link';
import { Shell } from '@zavlio/ui';
import { safeNextPath } from '../../lib/auth/redirects';

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const hasError = params.error === 'invalid' || params.error === 'forbidden';
  return (
    <Shell>
      <main aria-labelledby="login-title">
        <h1 id="login-title">Staff login</h1>
        <p>Sign in with your Zavlio invitation credentials.</p>
        {hasError ? <p role="alert">We could not sign you in with those details.</p> : null}
        <form action="/auth/login" method="post">
          <input type="hidden" name="next" value={next} />
          <p>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </p>
          <p>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </p>
          <button type="submit">Sign in</button>
        </form>
        <p>
          <Link href={`/auth/forgot-password?next=${encodeURIComponent(next)}`}>
            Forgot password?
          </Link>
        </p>
      </main>
    </Shell>
  );
}
