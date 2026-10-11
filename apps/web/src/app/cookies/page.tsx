import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { CookieManager } from '../../components/cookie-manager';

export const metadata: Metadata = {
  title: 'Cookie Policy & Preferences — Zavlio',
  description:
    'Detailed disclosure of cookies used on zavlio.online. Manage your first-party analytics consent preferences.',
  alternates: {
    canonical: 'https://zavlio.online/cookies',
  },
  openGraph: {
    title: 'Cookie Policy & Preferences — Zavlio',
    description: 'Detailed disclosure of cookies used on zavlio.online.',
  },
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">CONSENT MANAGEMENT</Badge>
                <Eyebrow>TRANSPARENCY · CONTROL · SOVEREIGNTY</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif className="text-slate-950">
                Cookie Policy & Preferences
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                We believe you should have complete, transparent control over your browser data.
                Below is an exhaustive breakdown of the cookies we set and their specific lifespans.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-white">
          <Container size="narrow">
            <div className="space-y-12">
              {/* Interactive manager */}
              <div className="space-y-4">
                <Eyebrow>INTERACTIVE PREFERENCE MANAGER</Eyebrow>
                <CookieManager />
              </div>

              {/* Table of cookies */}
              <div className="space-y-6 pt-8 border-t border-slate-200/80">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  Exhaustive Cookie Inventory
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 font-mono text-slate-500">
                        <th className="p-3.5 font-semibold">Name</th>
                        <th className="p-3.5 font-semibold">Purpose</th>
                        <th className="p-3.5 font-semibold">Category</th>
                        <th className="p-3.5 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                      <tr>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">zv_consent</td>
                        <td className="p-3.5">Stores your consent state and policy version.</td>
                        <td className="p-3.5 font-medium text-slate-800">Strictly Essential</td>
                        <td className="p-3.5 font-mono">180 days</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">zv_vid</td>
                        <td className="p-3.5">Anonymous random visitor UUID for analytics.</td>
                        <td className="p-3.5 font-medium text-slate-800">Analytics (Optional)</td>
                        <td className="p-3.5 font-mono">180 days</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-mono font-bold text-indigo-600">zv_sid</td>
                        <td className="p-3.5">Anonymous session UUID for pageview stitching.</td>
                        <td className="p-3.5 font-medium text-slate-800">Analytics (Optional)</td>
                        <td className="p-3.5 font-mono">30 min inactivity</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GPC and DNT */}
              <div className="space-y-4 border-t border-slate-200/80 pt-8 text-sm text-slate-600 leading-relaxed">
                <h2 className="font-sans text-xl font-bold text-slate-900">
                  Global Privacy Control (GPC)
                </h2>
                <p>
                  We automatically honor the Global Privacy Control (GPC) header. If your browser
                  broadcasts a GPC signal and you have not previously accepted analytics, we treat
                  it as an immediate denial of non-essential tracking.
                </p>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
