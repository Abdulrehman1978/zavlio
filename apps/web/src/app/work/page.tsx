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
  Card,
  Badge,
} from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { PROJECTS } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Selected Work & Case Studies — Zavlio',
  description:
    'An index of digital products, design systems, and software platforms engineered by Zavlio. Honest studio cases and reference architectures.',
  openGraph: {
    title: 'Selected Work & Case Studies — Zavlio',
    description:
      'An index of digital products, design systems, and software platforms engineered by Zavlio.',
  },
};

export default function WorkIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Header Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">PORTFOLIO & CASES</Badge>
                <Eyebrow>SELECTED WORK · 2025–2026</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif>
                Selected work.
              </DisplayHeading>
              <BodyCopy size="lead">
                A curated selection of digital products, design systems, and platforms built with
                meticulous typographic craft, robust architecture, and performance discipline.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Project Grid */}
        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {PROJECTS.map((project) => (
                <Card
                  key={project.slug}
                  className="group flex flex-col justify-between p-8 sm:p-12 hover:border-[#BBB6AA]"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="default">{project.tag.replace('_', ' ')}</Badge>
                      <span className="font-mono text-xs text-[#524F47]">{project.year}</span>
                    </div>

                    {/* Visual Media Placeholder Box */}
                    <div className="aspect-[16/10] w-full bg-[#EAE6DC] border border-[#D8D4CA] flex items-center justify-center p-8 text-center transition-colors group-hover:bg-[#E5E0D5]">
                      <div className="space-y-2">
                        <span className="font-mono text-xs uppercase tracking-widest text-[#524F47] block">
                          Case Study Presentation
                        </span>
                        <h2 className="font-serif text-2xl sm:text-3xl text-[#0D0D0D]">
                          {project.title}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#646059]">
                          {project.type}
                        </span>
                        <span className="font-mono text-xs text-[#524F47]">{project.client}</span>
                      </div>
                      <p className="text-sm sm:text-base text-[#383530] leading-relaxed">
                        {project.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 mt-8 border-t border-[#D8D4CA] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {project.disciplines.map((disc) => (
                        <span
                          key={disc}
                          className="font-mono text-[11px] text-[#646059] bg-[#FAF8F4] px-2.5 py-1 border border-[#D8D4CA]"
                        >
                          {disc}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/work/${project.slug}`}
                      className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] hover:underline"
                    >
                      Read Case Study →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* Bottom CTA */}
        <Section spacing="default" className="border-t border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>START A CONVERSATION</Eyebrow>
              <SectionHeading as="h2" serif>
                Have a project in mind?
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg">
                We partner with ambitious founders, established leaders, and innovation teams to
                create work that stands apart.
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
