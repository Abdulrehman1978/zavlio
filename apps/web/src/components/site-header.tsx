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
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#0D0D0D] focus:text-[#FAF8F4] focus:font-mono focus:text-xs"
      >
        Skip to main content
      </a>

      <header
        role="banner"
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-[#F5F2EA]/90 backdrop-blur-md border-b border-[#D8D4CA]/80 shadow-[0_4px_20px_-10px_rgba(13,13,13,0.06)]'
            : 'bg-[#F5F2EA] border-b border-[#D8D4CA]/40'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16">
          {/* Brand mark */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold tracking-[0.08em] text-[#0D0D0D] focus-visible:outline-2 focus-visible:outline-[#0D0D0D]"
            aria-label="Zavlio Home"
          >
            <span className="uppercase">Zavlio</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#0D0D0D] transition-transform duration-200 group-hover:scale-125 group-hover:bg-[#D8FF45]" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 lg:gap-10"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm tracking-wide transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#0D0D0D] ${
                    active
                      ? 'text-[#0D0D0D] font-semibold border-b border-[#0D0D0D] pb-0.5'
                      : 'text-[#646059] hover:text-[#0D0D0D]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/start-a-project"
              onClick={() => handleCtaClick('header_start_project', '/start-a-project')}
            >
              <Button variant="primary" size="default">
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
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden focus-visible:outline-2 focus-visible:outline-[#0D0D0D] cursor-pointer"
          >
            <span
              className={`h-0.5 w-6 bg-[#0D0D0D] transition-transform duration-200 ${
                mobileOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-[#0D0D0D] transition-opacity duration-200 ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-[#0D0D0D] transition-transform duration-200 ${
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
          className="fixed inset-0 top-20 z-40 flex flex-col bg-[#FAF8F4] p-6 sm:p-8 md:hidden border-b border-[#D8D4CA] shadow-2xl overflow-y-auto animate-in fade-in duration-200"
        >
          <nav aria-label="Mobile menu links" className="flex flex-col gap-6 py-6">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-2xl font-serif tracking-tight transition-colors ${
                    active ? 'text-[#0D0D0D] font-bold underline' : 'text-[#646059]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8 border-t border-[#D8D4CA]">
            <Link
              href="/start-a-project"
              onClick={() => {
                setMobileOpen(false);
                handleCtaClick('mobile_start_project', '/start-a-project');
              }}
              className="w-full"
            >
              <Button variant="primary" size="lg" className="w-full">
                Start a project
              </Button>
            </Link>
            <div className="mt-6 flex justify-between text-xs font-mono text-[#646059]">
              <a href="mailto:hello@zavlio.online">hello@zavlio.online</a>
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
