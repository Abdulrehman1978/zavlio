import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { SpatialKineticArtifact } from '../../../components/spatial-kinetic-artifact';
import { LAB_EXPERIMENTS } from '../../../lib/content';

export function generateStaticParams() {
  return LAB_EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lab = LAB_EXPERIMENTS.find((e) => e.slug === slug);
  if (!lab) return { title: 'Experiment Not Found — Zavlio' };

  return {
    title: `${lab.title} — Zavlio Lab`,
    description: lab.description,
    openGraph: {
      title: `${lab.title} — Zavlio Lab`,
      description: lab.description,
    },
  };
}

export default async function LabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = LAB_EXPERIMENTS.find((e) => e.slug === slug);
  if (!lab) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Lab Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Link href="/lab" className="font-mono text-xs text-[#646059] hover:text-[#0D0D0D]">
                  ← ALL EXPERIMENTS
                </Link>
                <span className="text-[#BBB6AA]">/</span>
                <Badge variant="accent">{lab.category.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="xl" serif>
                {lab.title}
              </DisplayHeading>

              <p className="font-mono text-xs uppercase tracking-wider text-[#646059]">
                Status: {lab.status.replace('_', ' ')} · Self-Initiated Study
              </p>

              <BodyCopy size="lead" className="max-w-3xl">
                {lab.description}
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Interactive Experiment Preview */}
        <Section spacing="compact" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <SpatialKineticArtifact height={400} />
          </Container>
        </Section>

        {/* Hypothesis & Findings */}
        <Section spacing="default" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-6 space-y-4">
                <Eyebrow>RESEARCH HYPOTHESIS</Eyebrow>
                <SectionHeading as="h2" serif>
                  What we set out to prove.
                </SectionHeading>
                <Card hover={false} className="p-8 space-y-3 bg-[#FAF8F4]">
                  <p className="text-base sm:text-lg text-[#0D0D0D] leading-relaxed italic">
                    &ldquo;{lab.hypothesis}&rdquo;
                  </p>
                </Card>
              </div>

              <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-[#D8D4CA] pt-8 lg:pt-0 lg:pl-12">
                <Eyebrow>OBSERVED FINDINGS</Eyebrow>
                <SectionHeading as="h2" serif>
                  Empirical results & implications.
                </SectionHeading>
                <Card hover={false} className="p-8 space-y-3 bg-[#FAF8F4]">
                  <p className="text-base sm:text-lg text-[#383530] leading-relaxed">
                    {lab.findings}
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </Section>

        {/* Stack & Implementation details */}
        <Section spacing="default" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-3xl space-y-6">
              <Eyebrow>TECHNICAL STACK</Eyebrow>
              <SectionHeading as="h2" serif>
                Architecture & tools used in this prototype.
              </SectionHeading>
              <div className="flex flex-wrap gap-3">
                {lab.stack.map((item) => (
                  <span
                    key={item}
                    className="font-mono text-sm bg-[#FFFFFF] text-[#0D0D0D] px-4 py-2 border border-[#D8D4CA]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
