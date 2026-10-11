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
import { ProjectVisual } from '../../../components/project-visual';
import { PROJECTS } from '../../../lib/content';
import { getResolvedProjects, getResolvedProjectBySlug } from '../../../lib/content-resolver';

export const dynamicParams = true;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getResolvedProjectBySlug(slug);
  if (!project) return { title: 'Project Not Found — Zavlio' };

  return {
    title: `${project.title} — Case Study | Zavlio`,
    description: project.summary,
    alternates: {
      canonical: `https://zavlio.online/work/${slug}`,
    },
    openGraph: {
      title: `${project.title} — Case Study | Zavlio`,
      description: project.summary,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getResolvedProjectBySlug(slug);
  if (!project) notFound();

  // Find next project
  const allProjects = await getResolvedProjects();
  const currentIndex = allProjects.findIndex((p) => p.slug === slug);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length] ?? project;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Project Hero */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container>
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/work"
                  className="font-mono text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← ALL WORK
                </Link>
                <span className="text-slate-300">/</span>
                <Badge variant="accent">{project.tag.replace('_', ' ')}</Badge>
              </div>

              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                {project.title}
              </DisplayHeading>

              <p className="font-mono text-sm tracking-wide text-indigo-600 font-semibold">
                {project.type} · {project.year}
              </p>

              <BodyCopy size="lead" className="max-w-3xl text-slate-600 font-normal">
                {project.summary}
              </BodyCopy>

              <div className="flex flex-wrap gap-2 pt-2">
                {project.disciplines.map((disc) => (
                  <span
                    key={disc}
                    className="font-mono text-xs text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs font-medium"
                  >
                    {disc}
                  </span>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* Big Media Showcase Frame */}
        <Section spacing="compact" className="bg-slate-50/60 border-b border-slate-200/70">
          <Container>
            <ProjectVisual slug={project.slug} aspect="showcase" />
          </Container>
        </Section>

        {/* Challenge & Approach Grid */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-6 space-y-4">
                <Eyebrow>01 · THE CHALLENGE</Eyebrow>
                <SectionHeading as="h2" serif className="text-slate-950">
                  Navigating the core problem.
                </SectionHeading>
                <BodyCopy size="lead" className="text-slate-600 font-normal">
                  {project.challenge}
                </BodyCopy>
              </div>

              <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-8 lg:pt-0 lg:pl-12">
                <Eyebrow>02 · OUR APPROACH</Eyebrow>
                <SectionHeading as="h2" serif className="text-slate-950">
                  Engineering the solution.
                </SectionHeading>
                <BodyCopy size="lead" className="text-slate-600 font-normal">
                  {project.approach}
                </BodyCopy>
              </div>
            </div>
          </Container>
        </Section>

        {/* Outcome & Impact */}
        <Section spacing="default" className="bg-slate-50/50 border-b border-slate-200/70">
          <Container>
            <div className="max-w-3xl space-y-6">
              <Eyebrow>03 · PROJECT DELIVERABLES & OUTCOME</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Technical deliverables & results.
              </SectionHeading>
              <Card hover={false} className="p-8 sm:p-12 space-y-4 bg-white">
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                  {project.outcome}
                </p>
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Classification: {project.tag.replace('_', ' ')}</span>
                  <span>Accessibility: Axe-Audited Semantics</span>
                </div>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Next Project Footer */}
        <Section spacing="default" className="bg-white">
          <Container>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 sm:p-10 rounded-2xl border border-slate-200/80 bg-slate-50/70 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
                  Next Case Study
                </span>
                <h3 className="font-sans text-2xl font-bold text-slate-900">{nextProject.title}</h3>
                <p className="font-mono text-xs text-slate-500">{nextProject.type}</p>
              </div>
              <Link href={`/work/${nextProject.slug}`}>
                <Button variant="accent" size="default" className="shadow-xs">
                  Read next case study →
                </Button>
              </Link>
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
                '@type': 'CreativeWork',
                name: project.title,
                description: project.summary,
                creator: {
                  '@type': 'Organization',
                  name: 'Zavlio',
                  url: 'https://zavlio.online',
                },
                keywords: project.disciplines.join(', '),
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
                    name: 'Work',
                    item: 'https://zavlio.online/work',
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: project.title,
                    item: `https://zavlio.online/work/${project.slug}`,
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
