import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { StartProjectForm } from '../../components/lead-intake-form';

export const metadata: Metadata = {
  title: 'Start a Project — Zavlio',
  description:
    'Begin your project enquiry with Zavlio. Guided 6-step project scoping for strategy, design, technology, and growth initiatives.',
  alternates: {
    canonical: 'https://zavlio.online/start-a-project',
  },
  openGraph: {
    title: 'Start a Project — Zavlio',
    description: 'Begin your project enquiry with Zavlio. Guided 6-step project scoping.',
  },
};

export default function StartAProjectPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1" aria-labelledby="start-project-title">
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">PROJECT INTAKE</Badge>
                <Eyebrow>SCOPING & ROADMAPPING</Eyebrow>
              </div>
              <DisplayHeading
                as="h1"
                id="start-project-title"
                size="xl"
                serif
                className="text-slate-950"
              >
                Start a project
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                Tell us about your goals, timing, and requirements. This guided questionnaire helps
                us understand your vision before our initial consultation.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" className="bg-slate-50/50">
          <Container size="narrow">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 md:p-14 shadow-md">
              <StartProjectForm />
            </div>

            <div className="mt-8 text-center text-xs font-mono text-slate-500">
              <span>Need immediate assistance? Email </span>
              <a
                href="mailto:hello@zavlio.online"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold"
              >
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
