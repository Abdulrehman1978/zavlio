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
  Card,
} from '@zavlio/ui';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';
import { OperatingCycle } from '../components/operating-cycle';
import { SpatialKineticArtifact } from '../components/spatial-kinetic-artifact';
import { ProjectVisual } from '../components/project-visual';
import {
  getResolvedProjects,
  getResolvedServices,
  getResolvedLabProjects,
  getResolvedInsights,
} from '../lib/content-resolver';

export const metadata = {
  title: "Zavlio — Build What's Next",
  description:
    'We build brands, products and digital systems that move businesses forward. Multidisciplinary strategy, design, engineering, and growth.',
  alternates: {
    canonical: 'https://zavlio.online',
  },
};

export default async function HomePage() {
  const [projects, services, labExperiments, insights] = await Promise.all([
    getResolvedProjects(),
    getResolvedServices(),
    getResolvedLabProjects(),
    getResolvedInsights(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <Section
          spacing="hero"
          className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          {/* Subtle Ambient Background Mesh */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          >
            <div className="h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-indigo-200/30 via-violet-200/20 to-sky-200/30 blur-3xl" />
          </div>

          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-6 md:space-y-8">
                <div className="inline-flex flex-wrap items-center gap-3">
                  <Badge variant="accent">MULTIDISCIPLINARY COMPANY</Badge>
                  <Eyebrow>STRATEGY · DESIGN · TECHNOLOGY · GROWTH</Eyebrow>
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase text-indigo-700 font-bold">
                    ZAVLIO
                  </p>
                  <DisplayHeading as="h1" size="xl" serif className="max-w-3xl text-slate-950">
                    Build what&apos;s next.
                  </DisplayHeading>
                </div>

                <BodyCopy size="lead" className="max-w-2xl text-slate-600 font-normal">
                  We build brands, products and digital systems that move businesses forward. An
                  integrated company uniting strategic rigor, editorial craft, and deep technical
                  engineering.
                </BodyCopy>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="/start-a-project">
                    <Button variant="accent" size="lg" className="shadow-md">
                      Start a project
                    </Button>
                  </Link>
                  <Link href="/work">
                    <Button variant="secondary" size="lg">
                      Explore work →
                    </Button>
                  </Link>
                </div>

                {/* 4 Core Pillars Grid */}
                <div className="pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs hover:border-indigo-200 transition-colors">
                    <span className="block text-indigo-600 font-mono font-bold text-xs uppercase tracking-wider">
                      01
                    </span>
                    <span className="text-slate-900 font-semibold text-sm">Strategy</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs hover:border-indigo-200 transition-colors">
                    <span className="block text-indigo-600 font-mono font-bold text-xs uppercase tracking-wider">
                      02
                    </span>
                    <span className="text-slate-900 font-semibold text-sm">Design</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs hover:border-indigo-200 transition-colors">
                    <span className="block text-indigo-600 font-mono font-bold text-xs uppercase tracking-wider">
                      03
                    </span>
                    <span className="text-slate-900 font-semibold text-sm">Technology</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs hover:border-indigo-200 transition-colors">
                    <span className="block text-indigo-600 font-mono font-bold text-xs uppercase tracking-wider">
                      04
                    </span>
                    <span className="text-slate-900 font-semibold text-sm">Growth</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <SpatialKineticArtifact height={440} />
              </div>
            </div>
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* CAPABILITIES / WHAT ZAVLIO DOES                                           */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-3 max-w-2xl">
                <Eyebrow>OUR DISCIPLINES</Eyebrow>
                <SectionHeading as="h2" serif>
                  Four core capabilities. One unified team.
                </SectionHeading>
                <BodyCopy>
                  We don’t separate strategy from design or design from code. Every initiative is
                  architected holistically from day one.
                </BodyCopy>
              </div>
              <Link href="/services">
                <Button variant="secondary" size="default">
                  View all capabilities →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Card
                  key={service.slug}
                  className="flex flex-col justify-between bg-slate-50/60 hover:bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        0{index + 1}
                      </span>
                      <Badge variant="outline">{service.title}</Badge>
                    </div>
                    <h3 className="font-sans text-xl font-bold text-slate-900">{service.title}</h3>
                    <p className="font-mono text-xs text-indigo-700 font-medium">
                      {service.tagline}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/80">
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Explore {service.title} →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* SELECTED WORK                                                             */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-slate-50/50">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-3 max-w-2xl">
                <Eyebrow>SELECTED WORK</Eyebrow>
                <SectionHeading as="h2" serif>
                  Crafted with precision. Built to endure.
                </SectionHeading>
                <BodyCopy>
                  A selection of recent studio cases, prototype systems, and reference architectures
                  representing our multidisciplinary execution standard.
                </BodyCopy>
              </div>
              <Link href="/work">
                <Button variant="secondary" size="default">
                  Browse all work →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((project) => (
                <Card
                  key={project.slug}
                  className="group flex flex-col justify-between p-8 sm:p-10 bg-white"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="accent">{project.tag.replace('_', ' ')}</Badge>
                      <span className="font-mono text-xs text-slate-600 font-medium">
                        {project.year}
                      </span>
                    </div>

                    <ProjectVisual slug={project.slug} />

                    <div className="space-y-2">
                      <h3 className="font-sans text-2xl font-bold text-slate-900">
                        {project.title}
                      </h3>
                      <p className="font-mono text-xs text-indigo-600 font-medium">
                        {project.type}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{project.summary}</p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.disciplines.slice(0, 2).map((disc) => (
                        <span
                          key={disc}
                          className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60"
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

        {/* ========================================================================= */}
        {/* OPERATING MODEL / THE CYCLE                                               */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="space-y-3 max-w-2xl mb-12 sm:mb-16">
              <Eyebrow>THE OPERATING CYCLE</Eyebrow>
              <SectionHeading as="h2" serif>
                From raw thesis to compound momentum.
              </SectionHeading>
              <BodyCopy>
                We operate on a continuous seven-stage loop. Every initiative flows from strategic
                thesis to identity, experience, backend systems, growth channels, empirical
                telemetry, and back into iterative evolution.
              </BodyCopy>
            </div>

            <OperatingCycle />
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* TECHNOLOGY STORY / SYSTEMS THINKING                                       */}
        {/* ========================================================================= */}
        <Section
          spacing="default"
          className="border-b border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white"
        >
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-indigo-400 font-bold bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60">
                  ENGINEERING DEPTH
                </span>
                <DisplayHeading as="h2" size="lg" serif className="text-white">
                  Software built with permanence in mind.
                </DisplayHeading>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                  We reject fragile templates and superficial marketing frontends. We architect
                  relational databases, strict role-based access security, deterministic event
                  telemetry, and resilient server-to-server workflows.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                  <div className="space-y-1">
                    <span className="font-mono text-2xl text-white font-bold">100%</span>
                    <p className="text-xs text-slate-400 font-mono">Strict TypeScript invariants</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-2xl text-white font-bold">0-Surveillance</span>
                    <p className="text-xs text-slate-400 font-mono">
                      First-party privacy analytics
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-2xl text-white font-bold">Axe-Audited</span>
                    <p className="text-xs text-slate-400 font-mono">Accessible semantic UI</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-2xl text-white font-bold">Edge-Ready</span>
                    <p className="text-xs text-slate-400 font-mono">Static & lean runtime</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 space-y-6 shadow-2xl backdrop-blur-md">
                <span className="font-mono text-xs text-indigo-400 uppercase tracking-wider block font-semibold">
                  Architecture Principles
                </span>
                <ul className="space-y-4">
                  <li className="flex gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="font-mono text-sm text-indigo-400 font-bold">01</span>
                    <div>
                      <strong className="text-sm font-sans text-white block font-semibold">
                        Relational Truth Over Ephemeral State
                      </strong>
                      <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                        Normalized PostgreSQL schemas with strict RLS and deterministic audit
                        trails.
                      </span>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="font-mono text-sm text-indigo-400 font-bold">02</span>
                    <div>
                      <strong className="text-sm font-sans text-white block font-semibold">
                        Supervised Automation Boundaries
                      </strong>
                      <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                        Autonomous jobs require verified policy gates, human approvals, and
                        idempotency.
                      </span>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="font-mono text-sm text-indigo-400 font-bold">03</span>
                    <div>
                      <strong className="text-sm font-sans text-white block font-semibold">
                        Core Web Vitals Discipline
                      </strong>
                      <span className="text-xs text-slate-400 leading-relaxed block mt-0.5">
                        Zero layout shifts, efficient asset delivery, and sub-frame execution
                        budgets.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* ZAVLIO LAB (RESEARCH & PROTOTYPES)                                        */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-slate-50/50">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-3 max-w-2xl">
                <Eyebrow>ZAVLIO LAB</Eyebrow>
                <SectionHeading as="h2" serif>
                  Self-initiated research & experiments.
                </SectionHeading>
                <BodyCopy>
                  We continuously test the frontiers of web graphics, AI agent protocols, and
                  typographic layout engines to keep our production craft sharp.
                </BodyCopy>
              </div>
              <Link href="/lab">
                <Button variant="secondary" size="default">
                  Explore Lab →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {labExperiments.map((lab) => (
                <Card key={lab.slug} className="flex flex-col justify-between p-6 sm:p-8 bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{lab.category}</Badge>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
                      </span>
                    </div>
                    <h3 className="font-sans text-xl font-bold text-slate-900">{lab.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{lab.description}</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-600 font-medium">
                      {lab.stack.slice(0, 2).join(' · ')}
                    </span>
                    <Link
                      href={`/lab/${lab.slug}`}
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

        {/* ========================================================================= */}
        {/* EDITORIAL INSIGHTS                                                        */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-slate-200/70 bg-white">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-3 max-w-2xl">
                <Eyebrow>INSIGHTS</Eyebrow>
                <SectionHeading as="h2" serif>
                  Perspectives on design, code, and systems.
                </SectionHeading>
                <BodyCopy>
                  Notes from our practice on building high-grade digital platforms and enduring
                  brands.
                </BodyCopy>
              </div>
              <Link href="/insights">
                <Button variant="secondary" size="default">
                  Read all insights →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight) => (
                <Card
                  key={insight.slug}
                  className="flex flex-col justify-between p-6 sm:p-8 bg-slate-50/60 hover:bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-600 font-semibold">
                        {insight.category}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 font-medium">
                        {insight.readTime}
                      </span>
                    </div>
                    <h3 className="font-sans text-xl font-bold text-slate-900 leading-snug">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{insight.excerpt}</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-600 font-medium">
                      {insight.date}
                    </span>
                    <Link
                      href={`/insights/${insight.slug}`}
                      className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Read →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* FINAL CONVERSION CTA                                                      */}
        {/* ========================================================================= */}
        <Section spacing="spacious" className="relative overflow-hidden bg-slate-50/60">
          <Container size="narrow">
            <div className="relative rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/20 border border-slate-200/80 p-10 sm:p-16 shadow-lg text-center space-y-6 sm:space-y-8">
              <Badge variant="accent">READY TO BEGIN</Badge>
              <DisplayHeading as="h2" size="lg" serif className="text-slate-950">
                Have something worth building? Let’s make it real.
              </DisplayHeading>
              <BodyCopy size="lead" className="mx-auto max-w-xl text-slate-600 font-normal">
                Whether you’re founding a new venture, repositioning an established brand, or
                building a mission-critical software platform, we’d love to talk.
              </BodyCopy>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link href="/start-a-project">
                  <Button variant="accent" size="lg" className="shadow-md">
                    Start a project
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" size="lg">
                    Send a message
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
                '@type': 'Organization',
                '@id': 'https://zavlio.online/#organization',
                name: 'Zavlio',
                url: 'https://zavlio.online',
                description:
                  'We build brands, products and digital systems that move businesses forward.',
              },
              {
                '@type': 'WebSite',
                '@id': 'https://zavlio.online/#website',
                url: 'https://zavlio.online',
                name: 'Zavlio',
                publisher: { '@id': 'https://zavlio.online/#organization' },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
