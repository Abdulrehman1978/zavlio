import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Card, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { INSIGHTS } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Insights & Perspectives — Zavlio',
  description:
    'Essays and notes on digital product architecture, systems engineering, editorial design, and first-party analytics from the Zavlio studio.',
  alternates: {
    canonical: 'https://zavlio.online/insights',
  },
  openGraph: {
    title: 'Insights & Perspectives — Zavlio',
    description:
      'Essays and notes on digital product architecture, systems engineering, editorial design, and first-party analytics.',
  },
};

export default function InsightsIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Insights Hero */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">EDITORIAL PERSPECTIVES</Badge>
                <Eyebrow>ARCHITECTURE · DESIGN · GROWTH</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif>
                Insights.
              </DisplayHeading>
              <BodyCopy size="lead">
                Perspectives from our team on building enduring digital products, the discipline of
                restrained motion, and the future of first-party privacy.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Articles List */}
        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container>
            <div className="space-y-8">
              {INSIGHTS.map((article) => (
                <Card
                  key={article.slug}
                  className="p-8 sm:p-12 transition-all duration-200 hover:border-[#BBB6AA]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="default">{article.category}</Badge>
                        <span className="font-mono text-xs text-[#524F47]">{article.readTime}</span>
                      </div>
                      <span className="font-mono text-xs text-[#646059] block">
                        Published {article.date}
                      </span>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <h2 className="font-serif text-2xl sm:text-3xl text-[#0D0D0D] leading-snug">
                        <Link href={`/insights/${article.slug}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </h2>

                      <p className="text-base text-[#383530] leading-relaxed">{article.excerpt}</p>

                      <div className="pt-2">
                        <Link
                          href={`/insights/${article.slug}`}
                          className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] hover:underline inline-flex items-center gap-1.5"
                        >
                          Read Essay →
                        </Link>
                      </div>
                    </div>
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
