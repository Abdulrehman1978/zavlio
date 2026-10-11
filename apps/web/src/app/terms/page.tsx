import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Zavlio',
  description:
    'Zavlio Terms of Service. Operational policies, intellectual property, and service engagement guidelines.',
  alternates: {
    canonical: 'https://zavlio.online/terms',
  },
  openGraph: {
    title: 'Terms of Service — Zavlio',
    description: 'Zavlio Terms of Service. Operational policies and engagement guidelines.',
  },
};

export default function TermsPage() {
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
                <Badge variant="accent">OPERATIONAL TERMS</Badge>
                <Eyebrow>LAST UPDATED · OCTOBER 2026</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif className="text-slate-950">
                Terms of Service
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                These terms govern the use of the Zavlio public website and outline the principles
                guiding our client engagements.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-white">
          <Container size="narrow">
            <div className="prose prose-neutral max-w-none space-y-10 text-slate-600 leading-relaxed font-normal">
              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  1. Permitted Website Use
                </h2>
                <p className="text-base">
                  The Zavlio website, design system, and technical demonstrations are provided to
                  communicate our multidisciplinary capabilities to prospective clients and
                  partners. You may browse, view case studies, and submit business enquiries for
                  lawful purposes only.
                </p>
                <p className="text-base">
                  Automated scraping, denial-of-service attempts, injection of hostile payloads via
                  intake forms, or reverse engineering of server APIs is strictly prohibited.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  2. Intellectual Property & Work Presentation
                </h2>
                <p className="text-base">
                  All branding, visual designs, typography arrangements, and custom code on this
                  site are the intellectual property of Zavlio or licensed partners. Case studies
                  labeled as &ldquo;Concept Architecture,&rdquo; &ldquo;Prototype System,&rdquo; or
                  &ldquo;Reference Implementation&rdquo; represent internal engineering benchmarks
                  and design demonstrations.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  3. Client Engagements
                </h2>
                <p className="text-base">
                  Submitting a project enquiry or contact message does not establish a binding
                  client relationship. Professional engagements commence only upon mutual execution
                  of a formal Master Services Agreement (MSA) and Statement of Work (SOW) specifying
                  deliverables, timelines, and commercial terms.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-sans text-2xl font-bold text-slate-900">
                  4. Limitation of Liability
                </h2>
                <p className="text-base">
                  The website and research prototypes are provided &ldquo;as is&rdquo; without
                  warranties of any kind. Zavlio is not liable for indirect, incidental, or
                  consequential damages arising from website access or temporary service
                  interruption.
                </p>
              </div>

              <div className="border-t border-slate-200/80 pt-6 text-xs font-mono text-slate-600">
                <span>Contact questions regarding these terms to: </span>
                <a
                  href="mailto:hello@zavlio.online"
                  className="text-indigo-600 underline font-semibold hover:text-indigo-800"
                >
                  hello@zavlio.online
                </a>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
