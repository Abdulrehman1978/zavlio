import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Container, Section, DisplayHeading, Badge } from '@zavlio/ui';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { INSIGHTS } from '../../../lib/content';
import { getResolvedInsightBySlug } from '../../../lib/content-resolver';

export const dynamicParams = true;

export function generateStaticParams() {
  return INSIGHTS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getResolvedInsightBySlug(slug);
  if (!insight) return { title: 'Insight Not Found — Zavlio' };

  return {
    title: `${insight.title} — Zavlio`,
    description: insight.excerpt,
    alternates: {
      canonical: `https://zavlio.online/insights/${slug}`,
    },
    openGraph: {
      title: `${insight.title} — Zavlio`,
      description: insight.excerpt,
    },
  };
}

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getResolvedInsightBySlug(slug);
  if (!insight) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Essay Header */}
        <Section
          spacing="hero"
          className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/80"
        >
          <Container size="narrow">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/insights"
                  className="font-mono text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  ← ALL INSIGHTS
                </Link>
                <span className="text-slate-300">/</span>
                <Badge variant="accent">{insight.category.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="lg" serif className="leading-tight text-slate-950">
                {insight.title}
              </DisplayHeading>

              <div className="flex items-center gap-6 font-mono text-xs text-slate-500 border-t border-slate-200/80 pt-4">
                <span>Published {insight.date}</span>
                <span>{insight.readTime}</span>
                <span>Author: Zavlio Practice</span>
              </div>
            </div>
          </Container>
        </Section>

        {/* Essay Body Content */}
        <Section spacing="default" className="bg-white">
          <Container size="narrow">
            <article className="space-y-12">
              <div className="border-l-4 border-indigo-600 pl-6 py-4 bg-indigo-50/30 rounded-r-2xl">
                <p className="font-sans text-xl sm:text-2xl text-slate-800 italic leading-relaxed font-medium">
                  &ldquo;{insight.excerpt}&rdquo;
                </p>
              </div>

              {insight.content.map((section) => (
                <div key={section.heading} className="space-y-6">
                  <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </article>

            {/* Author Attribution & Footer */}
            <div className="mt-16 pt-8 border-t border-slate-200/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-600 font-semibold">
                  Published By
                </span>
                <p className="font-sans text-lg font-bold text-slate-900">Zavlio Practice Group</p>
              </div>

              <Link href="/insights">
                <Button variant="secondary" size="default">
                  ← Back to Insights
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
