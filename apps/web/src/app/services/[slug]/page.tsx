import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Button,
  Container,
  Section,
  DisplayHeading,
  SectionHeading,
  Eyebrow,
  BodyCopy,
  Card,
  Badge,
} from '@zavlio/ui';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { SERVICES } from '../../../lib/content';

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return { title: 'Service Not Found — Zavlio' };

  return {
    title: `${service.title} Capability — Zavlio`,
    description: service.description,
    openGraph: {
      title: `${service.title} — Zavlio`,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Service Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/services"
                  className="font-mono text-xs text-[#646059] hover:text-[#0D0D0D]"
                >
                  ← ALL CAPABILITIES
                </Link>
                <span className="text-[#BBB6AA]">/</span>
                <Badge variant="accent">{service.title.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="xl" serif>
                {service.title}
              </DisplayHeading>

              <p className="font-mono text-base text-[#646059]">{service.tagline}</p>

              <BodyCopy size="lead" className="max-w-2xl">
                {service.description}
              </BodyCopy>

              <div className="pt-4">
                <Link href="/start-a-project">
                  <Button variant="primary" size="lg">
                    Engage on {service.title} →
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* Capabilities Breakdown */}
        <Section spacing="default" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>CORE SPECIALIZATIONS</Eyebrow>
              <SectionHeading as="h2" serif>
                Areas of focus within {service.title}.
              </SectionHeading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {service.capabilities.map((cap) => (
                <Card key={cap.title} className="p-8 space-y-4">
                  <h3 className="font-serif text-2xl text-[#0D0D0D]">{cap.title}</h3>
                  <BodyCopy size="default">{cap.detail}</BodyCopy>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Structured Process */}
        <Section spacing="default" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>DELIVERY METHODOLOGY</Eyebrow>
              <SectionHeading as="h2" serif>
                How we execute {service.title}.
              </SectionHeading>
              <BodyCopy>
                A predictable, phase-gated execution cycle ensuring transparent milestones and
                rigorous verification.
              </BodyCopy>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {service.process.map((step) => (
                <div
                  key={step.step}
                  className="border border-[#D8D4CA] bg-[#FAF8F4] p-8 space-y-4 relative"
                >
                  <span className="font-mono text-2xl font-bold text-[#0D0D0D] block">
                    {step.step}
                  </span>
                  <h3 className="font-serif text-xl text-[#0D0D0D]">{step.title}</h3>
                  <p className="text-sm text-[#383530] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Deliverables Matrix */}
        <Section spacing="default" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Eyebrow>TANGIBLE ARTIFACTS</Eyebrow>
                <SectionHeading as="h2" serif>
                  What you receive.
                </SectionHeading>
                <BodyCopy>
                  We don’t produce vague slide decks that gather dust. We deliver actionable
                  production-grade assets, documented specifications, and resilient code.
                </BodyCopy>
              </div>

              <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#D8D4CA] p-8 sm:p-10">
                <ul className="space-y-4">
                  {service.deliverables.map((item, idx) => (
                    <li
                      key={item}
                      className="flex items-center justify-between pb-3 border-b border-[#D8D4CA]/60 last:border-0 last:pb-0"
                    >
                      <span className="font-sans font-medium text-base text-[#0D0D0D]">{item}</span>
                      <span className="font-mono text-xs text-[#524F47]">0{idx + 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {/* Bottom CTA */}
        <Section spacing="default">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>NEXT STEPS</Eyebrow>
              <SectionHeading as="h2" serif>
                Let’s collaborate on {service.title}.
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg">
                Connect with our team to discuss your goals and explore how our{' '}
                {service.title.toLowerCase()} practice can support your growth.
              </BodyCopy>
              <div className="pt-2 flex justify-center gap-4">
                <Link href="/start-a-project">
                  <Button variant="primary" size="lg">
                    Start a project
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" size="lg">
                    Contact us
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
