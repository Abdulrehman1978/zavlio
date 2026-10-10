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
    <div className="flex min-h-screen flex-col bg-[#F5F2EA] text-[#0D0D0D]">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Essay Header */}
        <Section spacing="hero" className="border-b border-[#D8D4CA]/60">
          <Container size="narrow">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/insights"
                  className="font-mono text-xs text-[#646059] hover:text-[#0D0D0D]"
                >
                  ← ALL INSIGHTS
                </Link>
                <span className="text-[#BBB6AA]">/</span>
                <Badge variant="accent">{insight.category.toUpperCase()}</Badge>
              </div>

              <DisplayHeading as="h1" size="lg" serif className="leading-tight">
                {insight.title}
              </DisplayHeading>

              <div className="flex items-center gap-6 pt-2 font-mono text-xs text-[#646059] border-t border-[#D8D4CA] pt-4">
                <span>Published {insight.date}</span>
                <span>{insight.readTime}</span>
                <span>Author: Zavlio Practice</span>
              </div>
            </div>
          </Container>
        </Section>

        {/* Essay Body Content */}
        <Section spacing="default" className="bg-[#FAF8F4]">
          <Container size="narrow">
            <article className="space-y-12">
              <div className="border-l-2 border-[#0D0D0D] pl-6 py-2">
                <p className="font-serif text-xl sm:text-2xl text-[#0D0D0D] italic leading-relaxed">
                  &ldquo;{insight.excerpt}&rdquo;
                </p>
              </div>

              {insight.content.map((section) => (
                <div key={section.heading} className="space-y-6">
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#0D0D0D] tracking-tight">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      className="text-base sm:text-lg text-[#2A2723] leading-relaxed font-sans"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </article>

            {/* Author Attribution & Footer */}
            <div className="mt-16 pt-8 border-t border-[#D8D4CA] flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-[#646059]">
                  Published By
                </span>
                <p className="font-serif text-lg text-[#0D0D0D]">Zavlio Practice Group</p>
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
