import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Zavlio',
  description:
    'Zavlio Terms of Service. Operational policies, intellectual property, and service engagement guidelines.',
  openGraph: {
    title: 'Terms of Service — Zavlio',
    description: 'Zavlio Terms of Service. Operational policies and engagement guidelines.',
  },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="default">OPERATIONAL TERMS</Badge>
                <Eyebrow>LAST UPDATED · OCTOBER 2026</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="lg" serif>
                Terms of Service
              </DisplayHeading>
              <BodyCopy size="lead">
                These terms govern the use of the Zavlio public website and outline the principles
                guiding our client engagements.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="prose prose-neutral max-w-none space-y-10 text-[#383530] leading-relaxed">
              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">1. Permitted Website Use</h2>
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
                <h2 className="font-serif text-2xl text-[#0D0D0D]">
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
                <h2 className="font-serif text-2xl text-[#0D0D0D]">3. Client Engagements</h2>
                <p className="text-base">
                  Submitting a project enquiry or contact message does not establish a binding
                  client relationship. Professional engagements commence only upon mutual execution
                  of a formal Master Services Agreement (MSA) and Statement of Work (SOW) specifying
                  deliverables, timelines, and commercial terms.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#0D0D0D]">4. Limitation of Liability</h2>
                <p className="text-base">
                  The website and research prototypes are provided &ldquo;as is&rdquo; without
                  warranties of any kind. Zavlio is not liable for indirect, incidental, or
                  consequential damages arising from website access or temporary service
                  interruption.
                </p>
              </div>

              <div className="border-t border-[#D8D4CA] pt-6 text-xs font-mono text-[#646059]">
                <span>Contact questions regarding these terms to: </span>
                <a href="mailto:hello@zavlio.online" className="text-[#0D0D0D] underline">
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
