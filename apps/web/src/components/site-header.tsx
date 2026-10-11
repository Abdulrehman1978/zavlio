'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@zavlio/ui';
import { useAnalytics } from './analytics-provider';

const NAV_LINKS = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/lab', label: 'Lab' },
  { href: '/insights', label: 'Insights' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const analytics = useAnalytics();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile nav on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  const handleCtaClick = (ctaId: string, dest: string) => {
    analytics?.track('cta_clicked', { ctaId, placement: 'header', destination: dest });
    analytics?.track('start_project_opened', {});
  };

  return (
    <>
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:font-mono focus:text-xs focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header
        role="banner"
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.05)]'
            : 'bg-white/70 backdrop-blur-sm border-b border-slate-200/50'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16">
          {/* Brand mark */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-xl font-bold tracking-[0.06em] text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600 rounded-lg"
            aria-label="Zavlio Home"
          >
            <span className="uppercase tracking-wider font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">
              Zavlio
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-xs"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm tracking-wide px-3.5 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    active
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-mono uppercase tracking-wider text-slate-600 hover:text-indigo-600 px-3 py-2 transition-colors"
            >
              Client Portal
            </Link>
            <Link
              href="/start-a-project"
              onClick={() => handleCtaClick('header_start_project', '/start-a-project')}
            >
              <Button variant="accent" size="default" className="shadow-xs">
                Start a project
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden focus-visible:outline-2 focus-visible:outline-indigo-600 cursor-pointer rounded-xl bg-slate-100/80 border border-slate-200/60"
          >
            <span
              className={`h-0.5 w-5 bg-slate-800 transition-transform duration-200 ${
                mobileOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-slate-800 transition-opacity duration-200 ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-slate-800 transition-transform duration-200 ${
                mobileOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 top-20 z-40 flex flex-col bg-white/95 backdrop-blur-xl p-6 sm:p-8 md:hidden border-b border-slate-200 shadow-2xl overflow-y-auto animate-in fade-in duration-200"
        >
          <nav aria-label="Mobile menu links" className="flex flex-col gap-4 py-4">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-xl font-medium tracking-tight py-2 px-3 rounded-xl transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-mono uppercase tracking-wider text-slate-500 py-2 px-3"
            >
              Client Portal / Sign In →
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-200">
            <Link
              href="/start-a-project"
              onClick={() => {
                setMobileOpen(false);
                handleCtaClick('mobile_start_project', '/start-a-project');
              }}
              className="w-full"
            >
              <Button variant="accent" size="lg" className="w-full shadow-md">
                Start a project
              </Button>
            </Link>
            <div className="mt-6 flex justify-between text-xs font-mono text-slate-500">
              <a href="mailto:hello@zavlio.online" className="hover:text-indigo-600">
                hello@zavlio.online
              </a>
              <a
                href="https://instagram.com/zavliohq"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  analytics?.track('outbound_social_click', {
                    platform: 'instagram',
                    destination: 'https://instagram.com/zavliohq',
                  })
                }
                className="hover:text-indigo-600"
              >
                @zavliohq
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
