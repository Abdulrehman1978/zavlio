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
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1" aria-labelledby="contact-title">
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">DIRECT COMMUNICATION</Badge>
                <Eyebrow>HELLO@ZAVLIO.ONLINE</Eyebrow>
              </div>
              <DisplayHeading as="h1" id="contact-title" size="xl" serif>
                Contact us
              </DisplayHeading>
              <BodyCopy size="lead">
                Tell us what you need and our team will review your message. We respond to all
                serious business enquiries within one business day.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <div className="border border-[#D8D4CA] bg-[#FFFFFF] p-8 sm:p-12 md:p-14 shadow-sm">
              <ContactForm />
            </div>

            <div className="mt-8 text-center text-xs font-mono text-[#646059]">
              <span>Direct inquiries: </span>
              <a href="mailto:hello@zavlio.online" className="text-[#0D0D0D] underline">
                hello@zavlio.online
              </a>
              <span> · Follow on Instagram: </span>
              <a
                href="https://instagram.com/zavliohq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0D0D0D] underline"
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
