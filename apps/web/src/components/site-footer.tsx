'use client';

import Link from 'next/link';
import { useAnalytics } from './analytics-provider';

export function SiteFooter() {
  const analytics = useAnalytics();

  const handleSocialClick = (platform: string, destination: string) => {
    analytics?.track('outbound_social_click', { platform, destination });
  };

  return (
    <footer
      role="contentinfo"
      className="w-full bg-slate-950 text-slate-200 border-t border-slate-800/80"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 pt-16 md:pt-24 pb-12">
        {/* Top Brand & Operating Cycle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-800">
          <div className="lg:col-span-5 space-y-6">
            <Link
              href="/"
              className="inline-block text-2xl font-extrabold tracking-[0.06em] text-white focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg"
              aria-label="Zavlio Home"
            >
              <span className="uppercase tracking-wider">Zavlio</span>
            </Link>
            <p className="text-base sm:text-lg text-slate-400 max-w-md leading-relaxed font-normal">
              We build brands, products and digital systems that move businesses forward.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs tracking-wider uppercase text-emerald-400 font-medium">
                Systems Operational · Available For Q4 Projects
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-indigo-400 block mb-3 font-semibold">
                The Zavlio Operating Cycle
              </span>
              <p className="font-mono text-sm sm:text-base text-slate-300 tracking-tight leading-relaxed">
                IDEA <span className="text-indigo-400 font-bold">→</span> IDENTITY{' '}
                <span className="text-indigo-400 font-bold">→</span> EXPERIENCE{' '}
                <span className="text-indigo-400 font-bold">→</span> SYSTEM{' '}
                <span className="text-indigo-400 font-bold">→</span> GROWTH{' '}
                <span className="text-indigo-400 font-bold">→</span> INSIGHT{' '}
                <span className="text-indigo-400 font-bold">→</span> IDEA
              </p>
            </div>
            <div className="pt-6 flex flex-wrap items-center gap-6 text-sm text-slate-400 font-mono">
              <span>
                Direct:{' '}
                <a
                  href="mailto:hello@zavlio.online"
                  className="text-white hover:text-indigo-400 underline transition-colors"
                >
                  hello@zavlio.online
                </a>
              </span>
              <span>
                Instagram:{' '}
                <a
                  href="https://instagram.com/zavliohq"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialClick('instagram', 'https://instagram.com/zavliohq')}
                  className="text-white hover:text-indigo-400 underline transition-colors"
                >
                  @zavliohq
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-10 py-16 border-b border-slate-800">
          {/* Column 1: Work & Lab */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-slate-400 font-semibold">
              Selected Work
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/work"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/lab"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Zavlio Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Capabilities */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-slate-400 font-semibold">
              Capabilities
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services/strategy"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Strategy & Positioning
                </Link>
              </li>
              <li>
                <Link
                  href="/services/design"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Identity & Systems
                </Link>
              </li>
              <li>
                <Link
                  href="/services/technology"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Engineering & AI
                </Link>
              </li>
              <li>
                <Link
                  href="/services/growth"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Growth & Content
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-slate-400 font-semibold">
              Company
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  About Zavlio
                </Link>
              </li>
              <li>
                <Link
                  href="/insights"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/start-a-project"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Start a Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-slate-400 font-semibold">
              Governance
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  Cookie Preferences
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Metadata & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© {new Date().getFullYear()} Zavlio. All rights reserved.</p>
          <p>Built with craft, precision and systems thinking.</p>
        </div>
      </div>
    </footer>
  );
}
