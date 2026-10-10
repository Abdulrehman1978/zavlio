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
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Lab Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-3">
                  <Badge variant="accent">INTERNAL R&D</Badge>
                  <Eyebrow>EXPERIMENTS · PROTOTYPES · PAPERS</Eyebrow>
                </div>
                <DisplayHeading as="h1" size="xl" serif>
                  Zavlio Lab.
                </DisplayHeading>
                <BodyCopy size="lead">
                  Our internal studio research environment. We test the frontiers of interactive
                  graphics, autonomous AI orchestration, and micro-typography before introducing
                  them into production client architectures.
                </BodyCopy>
              </div>

              <div className="lg:col-span-5">
                <SpatialKineticArtifact height={340} />
              </div>
            </div>
          </Container>
        </Section>

        {/* Experiments Grid */}
        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>CURRENT EXPERIMENTS</Eyebrow>
              <SectionHeading as="h2" serif>
                Active prototypes and technical notes.
              </SectionHeading>
              <BodyCopy>
                Experiments are clearly labeled to distinguish self-initiated exploratory studies
                from commercial software products.
              </BodyCopy>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {labExperiments.map((exp) => (
                <Card
                  key={exp.slug}
                  className="flex flex-col justify-between p-8 hover:border-[#BBB6AA]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">{exp.category}</Badge>
                      <span className="font-mono text-[10px] text-[#646059]">
                        {exp.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-serif text-2xl text-[#0D0D0D]">{exp.title}</h3>
                      <p className="text-sm text-[#383530] leading-relaxed">{exp.description}</p>
                    </div>

                    <div className="bg-[#FAF8F4] border border-[#D8D4CA]/80 p-4 space-y-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#524F47] block">
                        Core Hypothesis
                      </span>
                      <p className="text-xs text-[#646059] leading-relaxed italic">
                        &ldquo;{exp.hypothesis}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#D8D4CA] flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {exp.stack.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[10px] text-[#524F47] bg-[#EAE6DC] px-2 py-0.5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/lab/${exp.slug}`}
                      className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] hover:underline"
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
