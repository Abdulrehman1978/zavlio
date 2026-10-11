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
import { getResolvedServiceBySlug } from '../../../lib/content-resolver';

export const dynamicParams = true;

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getResolvedServiceBySlug(slug);
  if (!service) return { title: 'Service Not Found — Zavlio' };

  return {
    title: `${service.title} Capability — Zavlio`,
    description: service.description,
    alternates: {
      canonical: `https://zavlio.online/services/${slug}`,
    },
    openGraph: {
      title: `${service.title} — Zavlio`,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getResolvedServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Service Hero */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container>
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/services"
                  className="font-mono text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← ALL CAPABILITIES
                </Link>
                <span className="text-slate-300">/</span>
                <Badge variant="accent">{service.title.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                {service.title}
              </DisplayHeading>

              <p className="font-mono text-base text-indigo-700 font-semibold">{service.tagline}</p>

              <BodyCopy size="lead" className="max-w-2xl text-slate-600 font-normal">
                {service.description}
              </BodyCopy>

              <div className="pt-4">
                <Link href="/start-a-project">
                  <Button variant="accent" size="lg" className="shadow-md">
                    Engage on {service.title} →
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* Capabilities Breakdown */}
        <Section spacing="default" className="bg-slate-50/50 border-b border-slate-200/70">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>CORE SPECIALIZATIONS</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Areas of focus within {service.title}.
              </SectionHeading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {service.capabilities.map((cap) => (
                <Card key={cap.title} className="p-8 space-y-4 bg-white">
                  <h3 className="font-sans text-2xl font-bold text-slate-900">{cap.title}</h3>
                  <BodyCopy size="default" className="text-slate-600 font-normal leading-relaxed">
                    {cap.detail}
                  </BodyCopy>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Structured Process */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>DELIVERY METHODOLOGY</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                How we execute {service.title}.
              </SectionHeading>
              <BodyCopy className="text-slate-600 font-normal">
                A predictable, phase-gated execution cycle ensuring transparent milestones and
                rigorous verification.
              </BodyCopy>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {service.process.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-8 space-y-4 relative hover:bg-white hover:border-indigo-300 transition-all shadow-xs"
                >
                  <span className="font-mono text-2xl font-bold text-indigo-600 block">
                    {step.step}
                  </span>
                  <h3 className="font-sans text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Deliverables Matrix */}
        <Section spacing="default" className="bg-slate-50/50 border-b border-slate-200/70">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Eyebrow>TANGIBLE ARTIFACTS</Eyebrow>
                <SectionHeading as="h2" serif className="text-slate-950">
                  What you receive.
                </SectionHeading>
                <BodyCopy className="text-slate-600 font-normal">
                  We don’t produce vague slide decks that gather dust. We deliver actionable
                  production-grade assets, documented specifications, and resilient code.
                </BodyCopy>
              </div>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs">
                <ul className="space-y-4">
                  {service.deliverables.map((item, idx) => (
                    <li
                      key={item}
                      className="flex items-center justify-between pb-3.5 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <span className="font-sans font-medium text-base text-slate-800">{item}</span>
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        0{idx + 1}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {/* Bottom CTA */}
        <Section spacing="default" className="bg-white">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>NEXT STEPS</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Let’s collaborate on {service.title}.
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg text-slate-600 font-normal">
                Connect with our team to discuss your goals and explore how our{' '}
                {service.title.toLowerCase()} practice can support your growth.
              </BodyCopy>
              <div className="pt-2 flex justify-center gap-4">
                <Link href="/start-a-project">
                  <Button variant="accent" size="lg" className="shadow-md">
                    Start a project →
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                name: service.title,
                description: service.description,
                provider: {
                  '@type': 'Organization',
                  name: 'Zavlio',
                  url: 'https://zavlio.online',
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://zavlio.online',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Services',
                    item: 'https://zavlio.online/services',
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: service.title,
                    item: `https://zavlio.online/services/${service.slug}`,
                  },
                ],
              },
            ],
          }),
        }}
      />
    </div>
  );
}
