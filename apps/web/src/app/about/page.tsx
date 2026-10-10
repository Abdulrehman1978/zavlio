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
import { OperatingCycle } from '../../components/operating-cycle';

export const metadata: Metadata = {
  title: 'About Zavlio — Multidisciplinary Company',
  description:
    'Why Zavlio exists, how we work, and our philosophy on uniting strategy, design, engineering, and systems thinking.',
  openGraph: {
    title: 'About Zavlio — Multidisciplinary Company',
    description:
      'Why Zavlio exists, how we work, and our philosophy on uniting strategy, design, engineering, and systems thinking.',
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* About Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">COMPANY PHILOSOPHY</Badge>
                <Eyebrow>PURPOSE · STANDARDS · PRACTICE</Eyebrow>
              </div>

              <DisplayHeading as="h1" size="xl" serif>
                Built to solve the fragmentation problem.
              </DisplayHeading>

              <BodyCopy size="lead" className="max-w-3xl">
                Most modern businesses hire a strategy firm to define their direction, a design
                agency to create their identity, a software vendor to build their platform, and a
                marketing team to drive growth. The result is almost always compromise, misaligned
                incentives, and diluted execution.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Why Zavlio Exists */}
        <Section spacing="default" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-4">
                <Eyebrow>01 · THE THESIS</Eyebrow>
                <SectionHeading as="h2" serif>
                  Integration produces superior outcomes.
                </SectionHeading>
              </div>

              <div className="lg:col-span-7 space-y-6 text-[#383530] leading-relaxed">
                <p className="text-base sm:text-lg">
                  Zavlio was founded on a singular conviction: when strategy, visual craft, deep
                  software engineering, and empirical growth operate as a single coordinated
                  discipline, companies move dramatically faster and build work that endures.
                </p>
                <p className="text-base sm:text-lg">
                  We don’t treat engineering as a subordinate task to visual design, nor do we treat
                  brand identity as mere cosmetic styling for software. We treat both as equal
                  partners in expressing corporate capability and building trust.
                </p>
                <p className="text-base sm:text-lg">
                  Our team combines senior practitioners across business architecture, typographic
                  direction, systems engineering, and first-party analytics. No hand-off gaps, no
                  finger-pointing, no loss in translation.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Core Principles */}
        <Section spacing="default" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-2xl space-y-3 mb-12">
              <Eyebrow>02 · OPERATIONAL STANDARDS</Eyebrow>
              <SectionHeading as="h2" serif>
                Our non-negotiable principles.
              </SectionHeading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 space-y-4">
                <span className="font-mono text-sm text-[#D8FF45] bg-[#0D0D0D] px-2.5 py-1 inline-block">
                  PRINCIPLE 01
                </span>
                <h3 className="font-serif text-2xl text-[#0D0D0D]">Truth Over Spectacle</h3>
                <BodyCopy>
                  We don’t fabricate client metrics, inflate claims, or use meaningless vanity
                  buzzwords. We communicate capability through genuine craft, transparent code, and
                  reproducible evidence.
                </BodyCopy>
              </Card>

              <Card className="p-8 space-y-4">
                <span className="font-mono text-sm text-[#D8FF45] bg-[#0D0D0D] px-2.5 py-1 inline-block">
                  PRINCIPLE 02
                </span>
                <h3 className="font-serif text-2xl text-[#0D0D0D]">Systems Over Frameworks</h3>
                <BodyCopy>
                  Trendy frontend frameworks come and go. Relational data integrity, clean security
                  boundaries, accessible semantic markup, and resilient API contracts last for
                  decades.
                </BodyCopy>
              </Card>

              <Card className="p-8 space-y-4">
                <span className="font-mono text-sm text-[#D8FF45] bg-[#0D0D0D] px-2.5 py-1 inline-block">
                  PRINCIPLE 03
                </span>
                <h3 className="font-serif text-2xl text-[#0D0D0D]">Restraint as Luxury</h3>
                <BodyCopy>
                  We believe true digital sophistication knows when to be quiet. We use generous
                  whitespace, confident typographic hierarchy, and intentional motion rather than
                  decorative chaos.
                </BodyCopy>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Operating Cycle Section */}
        <Section spacing="default" className="bg-[#FAF8F4] border-b border-[#D8D4CA]/60">
          <Container>
            <div className="space-y-3 max-w-2xl mb-12 sm:mb-16">
              <Eyebrow>03 · HOW WE WORK</Eyebrow>
              <SectionHeading as="h2" serif>
                The Zavlio Operating Cycle.
              </SectionHeading>
              <BodyCopy>
                Our 7-stage closed-loop methodology connecting strategy, execution, and empirical
                learning.
              </BodyCopy>
            </div>

            <OperatingCycle />
          </Container>
        </Section>

        {/* Call to action */}
        <Section spacing="default">
          <Container size="narrow">
            <div className="text-center space-y-6">
              <Eyebrow>PARTNERSHIP</Eyebrow>
              <SectionHeading as="h2" serif>
                Ready to work with Zavlio?
              </SectionHeading>
              <BodyCopy className="mx-auto max-w-lg">
                We accept a limited number of comprehensive engagements each year to ensure
                uncompromising focus and craft.
              </BodyCopy>
              <div className="pt-2 flex justify-center gap-4">
                <Link href="/start-a-project">
                  <Button variant="primary" size="lg">
                    Start a project
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" size="lg">
                    Direct enquiry
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
