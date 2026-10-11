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
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Header Hero */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">CAPABILITY SPECTRUM</Badge>
                <Eyebrow>FOUR DISCIPLINES · UNIFIED IMPACT</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                Multidisciplinary capabilities.
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                We believe exceptional digital products cannot be assembled from fragmented
                agencies. We unite strategic clarity, visual pedigree, deep engineering, and
                measurable growth under one coordinated roof.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Services Detail List */}
        <Section spacing="default" className="bg-slate-50/50">
          <Container>
            <div className="space-y-16">
              {services.map((service, idx) => (
                <div
                  key={service.slug}
                  id={service.slug}
                  className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 md:p-16 shadow-xs hover:border-indigo-300 transition-all duration-300"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Overview */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          0{idx + 1}
                        </span>
                        <Badge variant="accent">{service.title}</Badge>
                      </div>
                      <SectionHeading as="h2" serif className="text-3xl sm:text-4xl text-slate-950">
                        {service.title}
                      </SectionHeading>
                      <p className="font-mono text-sm text-indigo-700 font-semibold">
                        {service.tagline}
                      </p>
                      <BodyCopy className="text-slate-600 font-normal leading-relaxed">
                        {service.description}
                      </BodyCopy>
                      <div className="pt-4">
                        <Link href={`/services/${service.slug}`}>
                          <Button variant="accent" size="default" className="shadow-xs">
                            Deep dive into {service.title} →
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Capabilities & Deliverables */}
                    <div className="lg:col-span-7 space-y-8 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-8 lg:pt-0 lg:pl-10">
                      <div>
                        <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-4">
                          Key Capabilities
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {service.capabilities.map((cap) => (
                            <div
                              key={cap.title}
                              className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-5 space-y-1.5 hover:bg-white hover:border-indigo-200 transition-colors"
                            >
                              <strong className="font-sans text-sm text-slate-900 block font-bold">
                                {cap.title}
                              </strong>
                              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                {cap.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200/80 pt-6">
                        <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-3">
                          Typical Deliverables
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {service.deliverables.map((item) => (
                            <span
                              key={item}
                              className="font-mono text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200/60 font-medium"
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
        <Section spacing="default" className="border-t border-slate-200/70 bg-white">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>NEXT STEPS</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Ready to scope your initiative?
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg text-slate-600 font-normal">
                Tell us about your goals, timeline, and challenges. We’ll synthesize the right team
                and execution roadmap.
              </BodyCopy>
              <div className="pt-2">
                <Link href="/start-a-project">
                  <Button variant="accent" size="lg" className="shadow-md">
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
