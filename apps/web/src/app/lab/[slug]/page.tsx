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
import { getResolvedLabProjectBySlug } from '../../../lib/content-resolver';

export const dynamicParams = true;

export function generateStaticParams() {
  return LAB_EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lab = await getResolvedLabProjectBySlug(slug);
  if (!lab) return { title: 'Experiment Not Found — Zavlio' };

  return {
    title: `${lab.title} — Zavlio Lab`,
    description: lab.description,
    alternates: {
      canonical: `https://zavlio.online/lab/${slug}`,
    },
    openGraph: {
      title: `${lab.title} — Zavlio Lab`,
      description: lab.description,
    },
  };
}

export default async function LabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = await getResolvedLabProjectBySlug(slug);
  if (!lab) notFound();

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
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/lab"
                  className="font-mono text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← ALL EXPERIMENTS
                </Link>
                <span className="text-slate-300">/</span>
                <Badge variant="accent">{lab.category.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                {lab.title}
              </DisplayHeading>

              <p className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
                Status: {lab.status.replace('_', ' ')} · Self-Initiated Study
              </p>

              <BodyCopy size="lead" className="max-w-3xl text-slate-600 font-normal">
                {lab.description}
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Interactive Experiment Preview */}
        <Section spacing="compact" className="bg-slate-50/60 border-b border-slate-200/70">
          <Container>
            <SpatialKineticArtifact height={400} />
          </Container>
        </Section>

        {/* Hypothesis & Findings */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-6 space-y-4">
                <Eyebrow>RESEARCH HYPOTHESIS</Eyebrow>
                <SectionHeading as="h2" serif className="text-slate-950">
                  What we set out to prove.
                </SectionHeading>
                <Card
                  hover={false}
                  className="p-8 space-y-3 bg-slate-50/80 rounded-2xl border border-slate-200/70"
                >
                  <p className="text-base sm:text-lg text-slate-800 leading-relaxed italic">
                    &ldquo;{lab.hypothesis}&rdquo;
                  </p>
                </Card>
              </div>

              <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-8 lg:pt-0 lg:pl-12">
                <Eyebrow>OBSERVED FINDINGS</Eyebrow>
                <SectionHeading as="h2" serif className="text-slate-950">
                  Empirical results & implications.
                </SectionHeading>
                <Card
                  hover={false}
                  className="p-8 space-y-3 bg-slate-50/80 rounded-2xl border border-slate-200/70"
                >
                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                    {lab.findings}
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </Section>

        {/* Stack & Implementation details */}
        <Section spacing="default" className="bg-slate-50/50 border-b border-slate-200/70">
          <Container>
            <div className="max-w-3xl space-y-6">
              <Eyebrow>TECHNICAL STACK</Eyebrow>
              <SectionHeading as="h2" serif className="text-slate-950">
                Architecture & tools used in this prototype.
              </SectionHeading>
              <div className="flex flex-wrap gap-3">
                {lab.stack.map((item) => (
                  <span
                    key={item}
                    className="font-mono text-sm bg-white text-indigo-700 px-4 py-2 rounded-full border border-slate-200/80 shadow-xs font-semibold"
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
