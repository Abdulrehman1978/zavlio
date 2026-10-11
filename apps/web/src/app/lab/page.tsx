import type { Metadata } from 'next';
import Link from 'next/link';
import {
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
import { SpatialKineticArtifact } from '../../components/spatial-kinetic-artifact';
import { getResolvedLabProjects } from '../../lib/content-resolver';

export const metadata: Metadata = {
  title: 'Zavlio Lab — Research & Prototypes',
  description:
    'Self-initiated technical experiments, WebGL spatial shaders, autonomous agent architectures, and responsive typographic systems.',
  alternates: {
    canonical: 'https://zavlio.online/lab',
  },
  openGraph: {
    title: 'Zavlio Lab — Research & Prototypes',
    description:
      'Self-initiated technical experiments, WebGL spatial shaders, and autonomous AI architectures.',
  },
};

export default async function LabIndexPage() {
  const labExperiments = await getResolvedLabProjects();
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Lab Hero */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-3">
                  <Badge variant="accent">INTERNAL R&D</Badge>
                  <Eyebrow>EXPERIMENTS · PROTOTYPES · PAPERS</Eyebrow>
                </div>
                <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                  Zavlio Lab.
                </DisplayHeading>
                <BodyCopy size="lead" className="text-slate-600 font-normal">
                  Our internal studio research environment. We test the frontiers of interactive
                  graphics, autonomous AI orchestration, and micro-typography before introducing
                  them into production client architectures.
                </BodyCopy>
              </div>

              <div className="lg:col-span-5">
                <SpatialKineticArtifact height={360} />
              </div>
            </div>
          </Container>
        </Section>

        {/* Experiments Grid */}
        <Section spacing="default" className="bg-slate-50/50">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>CURRENT EXPERIMENTS</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Active prototypes and technical notes.
              </SectionHeading>
              <BodyCopy className="text-slate-600 font-normal">
                Experiments are clearly labeled to distinguish self-initiated exploratory studies
                from commercial software products.
              </BodyCopy>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {labExperiments.map((exp) => (
                <Card key={exp.slug} className="flex flex-col justify-between p-8 bg-white">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="accent">{exp.category}</Badge>
                      <span className="font-mono text-[10px] text-slate-600 font-medium">
                        {exp.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-sans text-2xl font-bold text-slate-900">{exp.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-normal">
                        {exp.description}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 p-4 space-y-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-600 font-bold block">
                        Core Hypothesis
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        &ldquo;{exp.hypothesis}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {exp.stack.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/lab/${exp.slug}`}
                      className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Inspect →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
