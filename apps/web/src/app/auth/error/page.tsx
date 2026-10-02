import Link from 'next/link';
import { Shell } from '@zavlio/ui';

export default function AuthErrorPage() {
  return (
    <Shell>
      <main aria-labelledby="auth-error-title">
        <h1 id="auth-error-title">Authentication could not be completed</h1>
        <p>The link may be expired or invalid. Request a new link or return to login.</p>
        <Link href="/login">Return to login</Link>
      </main>
    </Shell>
  );
}
