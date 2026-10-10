import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Button,
  Container,
  Section,
  DisplayHeading,
  SectionHeading,
  Eyebrow,
  BodyCopy,
  Badge,
} from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { getResolvedServices } from '../../lib/content-resolver';

export const metadata: Metadata = {
  title: 'Capabilities & Services — Zavlio',
  description:
    'Strategy, Design, Technology, and Growth. Four tightly integrated capabilities delivering end-to-end digital excellence.',
  alternates: {
    canonical: 'https://zavlio.online/services',
  },
  openGraph: {
    title: 'Capabilities & Services — Zavlio',
    description:
      'Strategy, Design, Technology, and Growth. Four tightly integrated capabilities delivering end-to-end digital excellence.',
  },
};

export default async function ServicesPage() {
  const services = await getResolvedServices();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Header Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">CAPABILITY SPECTRUM</Badge>
                <Eyebrow>FOUR DISCIPLINES · UNIFIED IMPACT</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif>
                Multidisciplinary capabilities.
              </DisplayHeading>
              <BodyCopy size="lead">
                We believe exceptional digital products cannot be assembled from fragmented
                agencies. We unite strategic clarity, visual pedigree, deep engineering, and
                measurable growth under one coordinated roof.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Services Detail List */}
        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container>
            <div className="space-y-16">
              {services.map((service, idx) => (
                <div
                  key={service.slug}
                  id={service.slug}
                  className="border border-[#D8D4CA] bg-[#FFFFFF] p-8 sm:p-12 md:p-16 transition-all duration-200"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Overview */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-[#524F47]">0{idx + 1}</span>
                        <Badge variant="default">{service.title}</Badge>
                      </div>
                      <SectionHeading as="h2" serif className="text-3xl sm:text-4xl">
                        {service.title}
                      </SectionHeading>
                      <p className="font-mono text-sm text-[#646059]">{service.tagline}</p>
                      <BodyCopy>{service.description}</BodyCopy>
                      <div className="pt-4">
                        <Link href={`/services/${service.slug}`}>
                          <Button variant="primary" size="default">
                            Deep dive into {service.title} →
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Capabilities & Deliverables */}
                    <div className="lg:col-span-7 space-y-8 border-t lg:border-t-0 lg:border-l border-[#D8D4CA] pt-8 lg:pt-0 lg:pl-10">
                      <div>
                        <span className="font-mono text-xs uppercase tracking-wider text-[#646059] block mb-4">
                          Key Capabilities
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {service.capabilities.map((cap) => (
                            <div
                              key={cap.title}
                              className="bg-[#FAF8F4] border border-[#D8D4CA]/80 p-4 space-y-1.5"
                            >
                              <strong className="font-sans text-sm text-[#0D0D0D] block">
                                {cap.title}
                              </strong>
                              <p className="text-xs text-[#646059] leading-relaxed">{cap.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#D8D4CA] pt-6">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#646059] block mb-3">
                          Typical Deliverables
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {service.deliverables.map((item) => (
                            <span
                              key={item}
                              className="font-mono text-xs bg-[#FAF8F4] text-[#0D0D0D] px-3 py-1 border border-[#D8D4CA]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Bottom CTA */}
        <Section spacing="default" className="border-t border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>NEXT STEPS</Eyebrow>
              <SectionHeading as="h2" serif>
                Ready to scope your initiative?
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg">
                Tell us about your goals, timeline, and challenges. We’ll synthesize the right team
                and execution roadmap.
              </BodyCopy>
              <div className="pt-2">
                <Link href="/start-a-project">
                  <Button variant="primary" size="lg">
                    Start a project →
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
