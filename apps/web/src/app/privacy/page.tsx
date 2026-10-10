import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zavlio',
  description:
    'Zavlio Privacy Policy. Transparent, conservative data governance, first-party consent-gated analytics, and lead intake data handling.',
  openGraph: {
    title: 'Privacy Policy — Zavlio',
    description: 'Zavlio Privacy Policy. Transparent, conservative data governance.',
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="default">DATA GOVERNANCE</Badge>
                <Eyebrow>POLICY VERSION 2026-09-V1</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif>
                Privacy Policy
              </DisplayHeading>
              <BodyCopy size="lead">
                Zavlio operates with strict data minimization principles. We do not sell personal
                information, deploy third-party advertising tracking pixels, or infer real
                identities without consent.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="prose prose-neutral max-w-none space-y-10 text-[#383530] leading-relaxed">
              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">1. First-Party Analytics</h2>
                <p className="text-base">
                  Our website uses a proprietary, consent-gated first-party analytics engine.
                  Non-essential analytics tracking is completely disabled by default until you
                  explicitly grant consent. If you reject analytics or send a Global Privacy Control
                  (GPC) signal, no visitor identifier is assigned, and no analytics events are
                  recorded.
                </p>
                <p className="text-base">
                  When consent is granted, we set a temporary first-party cookie (
                  <code className="font-mono text-xs bg-[#EAE6DC] px-1 py-0.5">zv_vid</code>) with a
                  random UUID. We do not store raw IP addresses or perform cross-site browser
                  fingerprinting.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">
                  2. Business Intake Information
                </h2>
                <p className="text-base">
                  When you submit an enquiry via our &ldquo;Start a project&rdquo; or &ldquo;Contact
                  us&rdquo; forms, we collect the details you provide (such as your name, work
                  email, organization, project goals, and approximate budget). This data is stored
                  securely in our PostgreSQL database protected by strict Row-Level Security (RLS)
                  policies and used exclusively to evaluate and respond to your request.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">
                  3. Do-Not-Contact & Suppression Controls
                </h2>
                <p className="text-base">
                  We maintain a non-overridable Do-Not-Contact (DNC) safeguard in our CRM. If you
                  request that we do not contact you, all proactive outbound communications are
                  permanently blocked across automated and staff workflows.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">4. Your Rights</h2>
                <p className="text-base">
                  You have the right to request access to the data we hold regarding your business
                  enquiry, request correction of inaccurate records, withdraw analytics consent at
                  any time via our{' '}
                  <Link href="/cookies" className="text-[#0D0D0D] underline font-medium">
                    Cookie Preferences
                  </Link>
                  , or request deletion of your information.
                </p>
                <p className="text-base">
                  To exercise any of these rights, contact our data privacy officer at{' '}
                  <a href="mailto:hello@zavlio.online" className="text-[#0D0D0D] underline">
                    hello@zavlio.online
                  </a>
                  .
                </p>
              </div>

              <div className="border-t border-[#D8D4CA] pt-6 text-xs font-mono text-[#646059]">
                <span>
                  Notice: This operational policy reflects current system behavior. Formal legal
                  review remains documented in platform governance records.
                </span>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
