import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { StartProjectForm } from '../../components/lead-intake-form';

export const metadata: Metadata = {
  title: 'Start a Project — Zavlio',
  description:
    'Begin your project enquiry with Zavlio. Guided 6-step project scoping for strategy, design, technology, and growth initiatives.',
  openGraph: {
    title: 'Start a Project — Zavlio',
    description: 'Begin your project enquiry with Zavlio. Guided 6-step project scoping.',
  },
};

export default function StartAProjectPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1" aria-labelledby="start-project-title">
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">PROJECT INTAKE</Badge>
                <Eyebrow>SCOPING & ROADMAPPING</Eyebrow>
              </div>
              <DisplayHeading as="h1" id="start-project-title" size="xl" serif>
                Start a project
              </DisplayHeading>
              <BodyCopy size="lead">
                Tell us about your goals, timing, and requirements. This guided questionnaire helps
                us understand your vision before our initial consultation.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="border border-[#D8D4CA] bg-[#FFFFFF] p-8 sm:p-12 md:p-14 shadow-sm">
              <StartProjectForm />
            </div>

            <div className="mt-8 text-center text-xs font-mono text-[#646059]">
              <span>Need immediate assistance? Email </span>
              <a href="mailto:hello@zavlio.online" className="text-[#0D0D0D] underline">
                hello@zavlio.online
              </a>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
