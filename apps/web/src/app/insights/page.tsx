import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, DisplayHeading, Eyebrow, BodyCopy, Card, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../components/site-header';
import { SiteFooter } from '../../components/site-footer';
import { getResolvedInsights } from '../../lib/content-resolver';

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

export default async function InsightsIndexPage() {
  const insights = await getResolvedInsights();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Insights Hero */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3">
                <Badge variant="accent">EDITORIAL PERSPECTIVES</Badge>
                <Eyebrow>ARCHITECTURE · DESIGN · GROWTH</Eyebrow>
              </div>
              <DisplayHeading as="h1" size="xl" serif className="text-slate-950">
                Insights.
              </DisplayHeading>
              <BodyCopy size="lead" className="text-slate-600 font-normal">
                Perspectives from our team on building enduring digital products, the discipline of
                restrained motion, and the future of first-party privacy.
              </BodyCopy>
            </div>
          </Container>
        </Section>

        {/* Articles List */}
        <Section spacing="default" className="bg-slate-50/50">
          <Container>
            <div className="space-y-8">
              {insights.map((article) => (
                <Card key={article.slug} className="p-8 sm:p-12 bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="accent">{article.category}</Badge>
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {article.readTime}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-600 block font-medium">
                        Published {article.date}
                      </span>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                        <Link
                          href={`/insights/${article.slug}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {article.title}
                        </Link>
                      </h2>

                      <p className="text-base text-slate-600 leading-relaxed font-normal">
                        {article.excerpt}
                      </p>

                      <div className="pt-2">
                        <Link
                          href={`/insights/${article.slug}`}
                          className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 transition-colors"
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
