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
import { PROJECTS, SERVICES, LAB_EXPERIMENTS, INSIGHTS } from '../lib/content';

export const metadata = {
  title: "Zavlio — Build What's Next",
  description:
    'We build brands, products and digital systems that move businesses forward. Multidisciplinary strategy, design, engineering, and growth.',
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-6 md:space-y-8">
                <div className="inline-flex items-center gap-3">
                  <Badge variant="accent">MULTIDISCIPLINARY COMPANY</Badge>
                  <Eyebrow>STRATEGY · DESIGN · TECHNOLOGY · GROWTH</Eyebrow>
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-sm tracking-[0.2em] uppercase text-[#646059]">
                    ZAVLIO
                  </p>
                  <DisplayHeading as="h1" size="xl" serif className="max-w-3xl">
                    Build what&apos;s next.
                  </DisplayHeading>
                </div>

                <BodyCopy size="lead" className="max-w-2xl text-[#383530]">
                  We build brands, products and digital systems that move businesses forward. An
                  integrated company uniting strategic rigor, editorial craft, and deep technical
                  engineering.
                </BodyCopy>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="/start-a-project">
                    <Button variant="primary" size="lg">
                      Start a project
                    </Button>
                  </Link>
                  <Link href="/work">
                    <Button variant="secondary" size="lg">
                      Explore work →
                    </Button>
                  </Link>
                </div>

                <div className="pt-6 border-t border-[#D8D4CA]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#646059]">
                  <div>
                    <span className="block text-[#0D0D0D] font-semibold text-sm">01</span>
                    <span>Strategy</span>
                  </div>
                  <div>
                    <span className="block text-[#0D0D0D] font-semibold text-sm">02</span>
                    <span>Design</span>
                  </div>
                  <div>
                    <span className="block text-[#0D0D0D] font-semibold text-sm">03</span>
                    <span>Technology</span>
                  </div>
                  <div>
                    <span className="block text-[#0D0D0D] font-semibold text-sm">04</span>
                    <span>Growth</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <SpatialKineticArtifact height={420} className="shadow-lg" />
              </div>
            </div>
          </Container>
        </Section>

        {/* ========================================================================= */}
        {/* CAPABILITIES / WHAT ZAVLIO DOES                                           */}
        {/* ========================================================================= */}
        <Section spacing="default" className="border-b border-[#D8D4CA]/60 bg-[#FAF8F4]">
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
                <Button variant="outline" size="default">
                  View all capabilities →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICES.map((service, index) => (
                <Card key={service.slug} className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-[#524F47]">0{index + 1}</span>
                      <Badge variant="outline">{service.title}</Badge>
                    </div>
                    <h3 className="font-serif text-2xl text-[#0D0D0D]">{service.title}</h3>
                    <p className="font-mono text-xs text-[#646059]">{service.tagline}</p>
                    <p className="text-sm text-[#383530] leading-relaxed">{service.description}</p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#D8D4CA]">
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center text-xs font-mono font-medium uppercase tracking-wider text-[#0D0D0D] hover:underline"
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
        <Section spacing="default" className="border-b border-[#D8D4CA]/60">
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
              {PROJECTS.map((project) => (
                <Card
                  key={project.slug}
                  className="group flex flex-col justify-between p-8 sm:p-10"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="default">{project.tag.replace('_', ' ')}</Badge>
                      <span className="font-mono text-xs text-[#524F47]">{project.year}</span>
                    </div>

                    <ProjectVisual slug={project.slug} />

                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl text-[#0D0D0D]">{project.title}</h3>
                      <p className="font-mono text-xs text-[#646059]">{project.type}</p>
                      <p className="text-sm text-[#383530] leading-relaxed">{project.summary}</p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#D8D4CA] flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.disciplines.slice(0, 2).map((disc) => (
                        <span
                          key={disc}
                          className="font-mono text-[10px] text-[#646059] bg-[#FAF8F4] px-2 py-0.5 border border-[#D8D4CA]"
                        >
                          {disc}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/work/${project.slug}`}
                      className="font-mono text-xs font-medium uppercase tracking-wider text-[#0D0D0D] hover:underline"
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
        <Section spacing="default" className="border-b border-[#D8D4CA]/60 bg-[#FAF8F4]">
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
          className="border-b border-[#D8D4CA]/60 bg-[#0D0D0D] text-[#FAF8F4]"
        >
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#D8FF45]">
                  ENGINEERING DEPTH
                </span>
                <DisplayHeading as="h2" size="lg" serif className="text-[#FAF8F4]">
                  Software built with permanence in mind.
                </DisplayHeading>
                <p className="text-base sm:text-lg text-[#A9A49A] leading-relaxed">
                  We reject fragile templates and superficial marketing frontends. We architect
                  relational databases, strict role-based access security, deterministic event
                  telemetry, and resilient server-to-server workflows.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#262626]">
                  <div className="space-y-1">
                    <span className="font-mono text-xl text-[#FAF8F4] font-semibold">100%</span>
                    <p className="text-xs text-[#A9A49A]">Strict TypeScript & type invariants</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xl text-[#FAF8F4] font-semibold">
                      0-Surveillance
                    </span>
                    <p className="text-xs text-[#A9A49A]">First-party privacy-first analytics</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xl text-[#FAF8F4] font-semibold">
                      Axe-Audited
                    </span>
                    <p className="text-xs text-[#A9A49A]">Semantic accessible interfaces</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xl text-[#FAF8F4] font-semibold">
                      Edge-Ready
                    </span>
                    <p className="text-xs text-[#A9A49A]">Static generation & lean runtime</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 border border-[#262626] bg-[#171717] p-8 sm:p-10 space-y-6">
                <span className="font-mono text-xs text-[#A9A49A] uppercase tracking-wider block">
                  Architecture Principles
                </span>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <span className="font-mono text-sm text-[#D8FF45]">01</span>
                    <div>
                      <strong className="text-sm font-sans text-[#FAF8F4] block">
                        Relational Truth Over Ephemeral State
                      </strong>
                      <span className="text-xs text-[#A9A49A]">
                        Normalized PostgreSQL schemas with strict RLS and deterministic audit
                        trails.
                      </span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-mono text-sm text-[#D8FF45]">02</span>
                    <div>
                      <strong className="text-sm font-sans text-[#FAF8F4] block">
                        Supervised Automation Boundaries
                      </strong>
                      <span className="text-xs text-[#A9A49A]">
                        Autonomous jobs require verified policy gates, human approvals, and
                        idempotency.
                      </span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-mono text-sm text-[#D8FF45]">03</span>
                    <div>
                      <strong className="text-sm font-sans text-[#FAF8F4] block">
                        Core Web Vitals Discipline
                      </strong>
                      <span className="text-xs text-[#A9A49A]">
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
        <Section spacing="default" className="border-b border-[#D8D4CA]/60">
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
              {LAB_EXPERIMENTS.map((lab) => (
                <Card key={lab.slug} className="flex flex-col justify-between p-6 sm:p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{lab.category}</Badge>
                      <span className="h-2 w-2 rounded-full bg-[#D8FF45] border border-[#0D0D0D]" />
                    </div>
                    <h3 className="font-serif text-xl text-[#0D0D0D]">{lab.title}</h3>
                    <p className="text-xs text-[#383530] leading-relaxed">{lab.description}</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-[#D8D4CA] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#524F47]">
                      {lab.stack.slice(0, 2).join(' · ')}
                    </span>
                    <Link
                      href={`/lab/${lab.slug}`}
                      className="font-mono text-xs font-medium uppercase tracking-wider text-[#0D0D0D] hover:underline"
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
        <Section spacing="default" className="border-b border-[#D8D4CA]/60 bg-[#FAF8F4]">
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
                <Button variant="outline" size="default">
                  Read all insights →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {INSIGHTS.map((insight) => (
                <Card key={insight.slug} className="flex flex-col justify-between p-6 sm:p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#524F47]">
                        {insight.category}
                      </span>
                      <span className="font-mono text-[11px] text-[#524F47]">
                        {insight.readTime}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-[#0D0D0D] leading-snug">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-[#646059] leading-relaxed">{insight.excerpt}</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-[#D8D4CA] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#524F47]">{insight.date}</span>
                    <Link
                      href={`/insights/${insight.slug}`}
                      className="font-mono text-xs font-medium uppercase tracking-wider text-[#0D0D0D] hover:underline"
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
        <Section spacing="spacious" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="text-center space-y-6 sm:space-y-8">
              <Badge variant="accent">READY TO BEGIN</Badge>
              <DisplayHeading as="h2" size="lg" serif>
                Have something worth building? Let’s make it real.
              </DisplayHeading>
              <BodyCopy size="lead" className="mx-auto max-w-xl text-[#383530]">
                Whether you’re founding a new venture, repositioning an established brand, or
                building a mission-critical software platform, we’d love to talk.
              </BodyCopy>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link href="/start-a-project">
                  <Button variant="primary" size="lg">
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
    </div>
  );
}
