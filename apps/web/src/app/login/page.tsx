import Link from 'next/link';
import { safeNextPath } from '../../lib/auth/redirects';

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const hasError = params.error === 'invalid' || params.error === 'forbidden';
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80 flex flex-col justify-center items-center p-6 text-slate-900">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent"
          >
            <span>Zavlio</span>
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
          </Link>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mt-1 font-semibold">
            Control Plane & CRM
          </p>
        </div>

        {/* Login Card */}
        <main
          aria-labelledby="login-title"
          className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)]"
        >
          <div className="space-y-2 mb-6">
            <h1 id="login-title" className="font-sans text-2xl font-extrabold text-slate-900">
              Staff login
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              Sign in with your Zavlio invitation credentials.
            </p>
          </div>

          {hasError ? (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 text-sm font-medium"
            >
              We could not sign you in with those details.
            </div>
          ) : null}

          <form action="/auth/login" method="post" className="space-y-5">
            <input type="hidden" name="next" value={next} />

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@zavlio.online"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-medium text-sm text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Sign in →
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href={`/auth/forgot-password?next=${encodeURIComponent(next)}`}
              className="text-xs font-mono text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </main>

        <div className="mt-8 text-center text-xs font-mono text-slate-600">
          <Link href="/" className="hover:text-slate-800 transition-colors">
            ← Return to zavlio.online
          </Link>
        </div>
      </div>
    </div>
  );
}
