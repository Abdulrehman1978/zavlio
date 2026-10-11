import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zavlio',
  description:
    'Zavlio Privacy Policy. Transparent, conservative data governance, first-party consent-gated analytics, and lead intake data handling.',
  alternates: {
    canonical: 'https://zavlio.online/privacy',
  },
  openGraph: {
    title: 'Privacy Policy — Zavlio',
    description: 'Zavlio Privacy Policy. Transparent, conservative data governance.',
  },
};

export default function PrivacyPage() {
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
                <Badge variant="accent">DATA GOVERNANCE</Badge>
                <Eyebrow>POLICY VERSION 2026-09-V1</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif className="text-slate-950">
                Privacy Policy
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                Zavlio operates with strict data minimization principles. We do not sell personal
                information, deploy third-party advertising tracking pixels, or infer real
                identities without consent.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-white">
          <Container size="narrow">
            <div className="prose prose-neutral max-w-none space-y-10 text-slate-600 leading-relaxed font-normal">
              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  1. First-Party Analytics
                </h2>
                <p className="text-base">
                  Our website uses a proprietary, consent-gated first-party analytics engine.
                  Non-essential analytics tracking is completely disabled by default until you
                  explicitly grant consent. If you reject analytics or send a Global Privacy Control
                  (GPC) signal, no visitor identifier is assigned, and no analytics events are
                  recorded.
                </p>
                <p className="text-base">
                  When consent is granted, we set a temporary first-party cookie (
                  <code className="font-mono text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200/60 font-semibold">
                    zv_vid
                  </code>
                  ) with a random UUID. We do not store raw IP addresses or perform cross-site
                  browser fingerprinting.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
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
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  3. Do-Not-Contact & Suppression Controls
                </h2>
                <p className="text-base">
                  We maintain a non-overridable Do-Not-Contact (DNC) safeguard in our CRM. If you
                  request that we do not contact you, all proactive outbound communications are
                  permanently blocked across automated and staff workflows.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">4. Your Rights</h2>
                <p className="text-base">
                  You have the right to request access to the data we hold regarding your business
                  enquiry, request correction of inaccurate records, withdraw analytics consent at
                  any time via our{' '}
                  <Link
                    href="/cookies"
                    className="text-indigo-600 underline font-semibold hover:text-indigo-800"
                  >
                    Cookie Preferences
                  </Link>
                  , or request deletion of your information.
                </p>
                <p className="text-base">
                  To exercise any of these rights, contact our privacy contact at{' '}
                  <a
                    href="mailto:hello@zavlio.online"
                    className="text-indigo-600 underline font-semibold hover:text-indigo-800"
                  >
                    hello@zavlio.online
                  </a>
                  .
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 text-xs font-mono text-slate-600">
                <span>
                  Notice: This operational policy reflects current system behavior. Formal legal
                  compliance review remains outstanding.
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
