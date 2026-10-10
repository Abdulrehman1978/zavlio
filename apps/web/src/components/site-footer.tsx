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
      className="w-full bg-[#0D0D0D] text-[#FAF8F4] border-t border-[#262626]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 pt-16 md:pt-24 pb-12">
        {/* Top Brand & Operating Cycle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-[#262626]">
          <div className="lg:col-span-5 space-y-6">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-[0.08em] text-[#FAF8F4] focus-visible:outline-2 focus-visible:outline-[#FAF8F4]"
              aria-label="Zavlio Home"
            >
              <span className="uppercase">Zavlio</span>
            </Link>
            <p className="text-base sm:text-lg text-[#A9A49A] max-w-md leading-relaxed">
              We build brands, products and digital systems that move businesses forward.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs tracking-wider uppercase text-[#D8FF45]">
                Strategy · Design · Technology · Growth
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#A9A49A] block mb-3">
                The Zavlio Operating Cycle
              </span>
              <p className="font-serif text-lg sm:text-xl text-[#FAF8F4] tracking-tight leading-snug">
                IDEA <span className="text-[#D8FF45]">→</span> IDENTITY{' '}
                <span className="text-[#D8FF45]">→</span> EXPERIENCE{' '}
                <span className="text-[#D8FF45]">→</span> SYSTEM{' '}
                <span className="text-[#D8FF45]">→</span> GROWTH{' '}
                <span className="text-[#D8FF45]">→</span> INSIGHT{' '}
                <span className="text-[#D8FF45]">→</span> IDEA
              </p>
            </div>
            <div className="pt-8 flex flex-wrap items-center gap-6 text-sm text-[#A9A49A]">
              <span>
                Direct:{' '}
                <a
                  href="mailto:hello@zavlio.online"
                  className="text-[#FAF8F4] underline hover:text-[#D8FF45]"
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
                  className="text-[#FAF8F4] underline hover:text-[#D8FF45]"
                >
                  @zavliohq
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-10 py-16 border-b border-[#262626]">
          {/* Column 1: Work & Lab */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#A9A49A]">
              Selected Work
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/work"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/lab" className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors">
                  Zavlio Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Capabilities */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#A9A49A]">
              Capabilities
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services/strategy"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Strategy & Positioning
                </Link>
              </li>
              <li>
                <Link
                  href="/services/design"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Identity & Systems
                </Link>
              </li>
              <li>
                <Link
                  href="/services/technology"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Engineering & AI
                </Link>
              </li>
              <li>
                <Link
                  href="/services/growth"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Growth & Content
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#A9A49A]">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  About Zavlio
                </Link>
              </li>
              <li>
                <Link
                  href="/insights"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/start-a-project"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Start a Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#A9A49A]">
              Governance
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#D8D4CA] hover:text-[#FAF8F4] transition-colors"
                >
                  Cookie Preferences
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[#A9A49A] hover:text-[#FAF8F4] transition-colors"
                >
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Metadata & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#A9A49A]">
          <p>© {new Date().getFullYear()} Zavlio. All rights reserved.</p>
          <p>Built with craft, precision and systems thinking.</p>
        </div>
      </div>
    </footer>
  );
}
