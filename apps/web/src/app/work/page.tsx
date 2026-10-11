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
import { ProjectVisual } from '../../components/project-visual';
import { getResolvedProjects } from '../../lib/content-resolver';

export const metadata: Metadata = {
  title: 'Selected Work & Case Studies — Zavlio',
  description:
    'An index of digital products, design systems, and software platforms engineered by Zavlio. Honest studio cases and reference architectures.',
  alternates: {
    canonical: 'https://zavlio.online/work',
  },
  openGraph: {
    title: 'Selected Work & Case Studies — Zavlio',
    description:
      'An index of digital products, design systems, and software platforms engineered by Zavlio.',
  },
};

export default async function WorkIndexPage() {
  const projects = await getResolvedProjects();

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
                <Badge variant="accent">PORTFOLIO & CASES</Badge>
                <Eyebrow>SELECTED WORK · 2025–2026</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                Selected work.
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                A curated selection of digital products, design systems, and platforms built with
                meticulous typographic craft, robust architecture, and performance discipline.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Project Grid */}
        <Section spacing="default" className="bg-slate-50/50">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {projects.map((project) => (
                <Card
                  key={project.slug}
                  className="group flex flex-col justify-between p-8 sm:p-12 bg-white"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="accent">{project.tag.replace('_', ' ')}</Badge>
                      <span className="font-mono text-xs text-slate-600 font-medium">
                        {project.year}
                      </span>
                    </div>

                    {/* Visual Media Schematic */}
                    <ProjectVisual slug={project.slug} />

                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
                          {project.type}
                        </span>
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {project.client}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                        {project.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 mt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {project.disciplines.map((disc) => (
                        <span
                          key={disc}
                          className="font-mono text-[11px] text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 font-medium"
                        >
                          {disc}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/work/${project.slug}`}
                      className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
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
        <Section spacing="default" className="border-t border-slate-200/70 bg-white">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>START A CONVERSATION</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Have a project in mind?
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg text-slate-600 font-normal">
                We partner with ambitious founders, established leaders, and innovation teams to
                create work that stands apart.
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
