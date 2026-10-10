import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { CookieManager } from '../../components/cookie-manager';

export const metadata: Metadata = {
  title: 'Cookie Policy & Preferences — Zavlio',
  description:
    'Detailed disclosure of cookies used on zavlio.online. Manage your first-party analytics consent preferences.',
  openGraph: {
    title: 'Cookie Policy & Preferences — Zavlio',
    description: 'Detailed disclosure of cookies used on zavlio.online.',
  },
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="default">CONSENT MANAGEMENT</Badge>
                <Eyebrow>TRANSPARENCY · CONTROL · SOVEREIGNTY</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif>
                Cookie Policy & Preferences
              </DisplayHeading>
              <BodyCopy size="lead">
                We believe you should have complete, transparent control over your browser data.
                Below is an exhaustive breakdown of the cookies we set and their specific lifespans.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="space-y-12">
              {/* Interactive manager */}
              <div className="space-y-4">
                <Eyebrow>INTERACTIVE PREFERENCE MANAGER</Eyebrow>
                <CookieManager />
              </div>

              {/* Table of cookies */}
              <div className="space-y-6 pt-8 border-t border-[#D8D4CA]">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">Exhaustive Cookie Inventory</h2>
                <div className="overflow-x-auto border border-[#D8D4CA] bg-[#FFFFFF]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8D4CA] bg-[#FAF8F4] font-mono text-[#646059]">
                        <th className="p-3">Name</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8D4CA]/60 text-[#383530]">
                      <tr>
                        <td className="p-3 font-mono font-semibold">zv_consent</td>
                        <td className="p-3">Stores your consent state and policy version.</td>
                        <td className="p-3">Strictly Essential</td>
                        <td className="p-3 font-mono">180 days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">zv_vid</td>
                        <td className="p-3">Anonymous random visitor UUID for analytics.</td>
                        <td className="p-3">Analytics (Optional)</td>
                        <td className="p-3 font-mono">180 days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">zv_sid</td>
                        <td className="p-3">Anonymous session UUID for pageview stitching.</td>
                        <td className="p-3">Analytics (Optional)</td>
                        <td className="p-3 font-mono">30 min inactivity</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GPC and DNT */}
              <div className="space-y-4 border-t border-[#D8D4CA] pt-8 text-sm text-[#383530] leading-relaxed">
                <h2 className="font-serif text-xl text-[#0D0D0D]">Global Privacy Control (GPC)</h2>
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
