import type { Metadata } from 'next';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { ContactForm } from '../../components/lead-intake-form';

export const metadata: Metadata = {
  title: 'Contact Zavlio — Start a Conversation',
  description:
    'Direct contact channel with the Zavlio team. Enquiries, partnerships, and studio dialogue.',
  alternates: {
    canonical: 'https://zavlio.online/contact',
  },
  openGraph: {
    title: 'Contact Zavlio — Start a Conversation',
    description: 'Direct contact channel with the Zavlio team.',
  },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1" aria-labelledby="contact-title">
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">DIRECT COMMUNICATION</Badge>
                <Eyebrow>HELLO@ZAVLIO.ONLINE</Eyebrow>
              </div>
              <DisplayHeading as="h1" id="contact-title" size="xl" serif className="text-slate-950">
                Contact us
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                Tell us what you need and our team will review your message. We respond to all
                serious business enquiries within one business day.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" className="bg-slate-50/50">
          <Container size="narrow">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 md:p-14 shadow-md">
              <ContactForm />
            </div>

            <div className="mt-8 text-center text-xs font-mono text-slate-500">
              <span>Direct inquiries: </span>
              <a
                href="mailto:hello@zavlio.online"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold"
              >
                hello@zavlio.online
              </a>
              <span> · Follow on Instagram: </span>
              <a
                href="https://instagram.com/zavliohq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline font-semibold"
              >
                @zavliohq
              </a>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
