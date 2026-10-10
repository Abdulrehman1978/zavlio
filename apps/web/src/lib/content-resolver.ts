import {
  PROJECTS,
  SERVICES,
  LAB_EXPERIMENTS as LAB_ITEMS,
  INSIGHTS,
  type ProjectItem,
  type ServiceItem,
  type LabItem,
  type InsightItem,
} from './content';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

/**
 * Content Resolver for Zavlio Public Routes.
 *
 * Implements a resilient, progressive resolution architecture:
 * 1. Queries Supabase for content items from public tables:
 *    - `projects`
 *    - `services`
 *    - `lab_projects`
 *    - `insights`
 * 2. Strictly enforces:
 *    - ZERO DRAFT LEAKAGE: Draft items (`status === 'DRAFT'`) never appear publicly.
 *    - ZERO ARCHIVED LEAKAGE: Archived items (`status === 'ARCHIVED'`) never appear publicly.
 *    - ZERO INTERNAL LEAKAGE: Internal items (`visibility === 'INTERNAL'`) never appear publicly.
 *    - UNAPPROVED CLAIM GATING: Content with unapproved claims (`claim_status === 'UNVERIFIED' || 'RETIRED'`) is suppressed.
 *    - PRODUCTION DEMO GATING: Demo content (`demo_content === true`) is excluded in production environments unless explicitly permitted.
 * 3. Precedence & Override:
 *    - If an item in PostgreSQL has the same slug as a static item in `content.ts`:
 *      - If published in DB: DB version takes precedence.
 *      - If archived/draft in DB: static item is suppressed (returns 404).
 *    - If an item in PostgreSQL is newly published: prepended to public listings.
 * 4. Controlled Fallback:
 *    - If the database is empty, unreachable, or unconfigured, falls back gracefully
 *      to the verified editorial baseline in `content.ts`.
 */

function getSafeDbClient(db?: SupabaseClient<Database> | null): SupabaseClient<Database> | null {
  if (db !== undefined) return db;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      db: { schema: 'public' },
    });
  } catch {
    return null;
  }
}

function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
    !process.env.ALLOW_DEMO_PUBLISH
  );
}

// ============================================================================
// PROJECTS RESOLVER
// ============================================================================

export async function getResolvedProjects(
  db?: SupabaseClient<Database> | null,
): Promise<ProjectItem[]> {
  const client = getSafeDbClient(db);
  if (!client) return PROJECTS;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return PROJECTS;
    }

    const isProd = isProductionEnvironment();
    const excludedSlugs = new Set<string>();
    const publishedProjects: ProjectItem[] = [];

    for (const item of data) {
      const isDraftOrArchived = item.status === 'DRAFT' || item.status === 'ARCHIVED';
      const isInternal = item.visibility === 'INTERNAL';
      const isUnapprovedClaim =
        item.claim_status === 'UNVERIFIED' || item.claim_status === 'RETIRED';
      const isUnsafeDemoInProd = isProd && Boolean(item.demo_content);

      if (isDraftOrArchived || isInternal || isUnapprovedClaim || isUnsafeDemoInProd) {
        excludedSlugs.add(item.slug);
        continue;
      }

      if (item.status === 'PUBLISHED' && item.visibility === 'PUBLIC') {
        const results = (item.results || {}) as Record<string, string>;
        publishedProjects.push({
          slug: item.slug,
          title: item.title,
          client: item.demo_content ? 'Internal Studio Study' : 'Zavlio Client',
          type: item.project_type || 'Digital Experience',
          year: item.year
            ? String(item.year)
            : item.published_at
              ? new Date(item.published_at).getFullYear().toString()
              : '2026',
          disciplines:
            item.disciplines && item.disciplines.length > 0
              ? item.disciplines
              : ['Design Systems', 'Digital Engineering'],
          summary: item.seo_description || item.project_type || '',
          challenge:
            results.challenge ||
            'Delivering restrained digital precision without architectural compromise.',
          approach:
            results.approach ||
            'Constructed using Zavlio core design tokens and robust full-stack architecture.',
          outcome:
            results.outcome ||
            'Verified digital experience operating with deterministic performance.',
          tag: (item.claim_status === 'VERIFIED'
            ? 'STUDIO_CASE'
            : item.claim_status === 'DEMO'
              ? 'PROTOTYPE_SYSTEM'
              : 'REFERENCE_IMPLEMENTATION') as ProjectItem['tag'],
          featured: true,
        });
      }
    }

    const publishedSlugs = new Set(publishedProjects.map((p) => p.slug));
    const mergedStatic = PROJECTS.filter(
      (p) => !excludedSlugs.has(p.slug) && !publishedSlugs.has(p.slug),
    );

    return [...publishedProjects, ...mergedStatic];
  } catch {
    return PROJECTS;
  }
}

export async function getResolvedProjectBySlug(
  slug: string,
  db?: SupabaseClient<Database> | null,
): Promise<ProjectItem | null> {
  const all = await getResolvedProjects(db);
  return all.find((p) => p.slug === slug) ?? null;
}

// ============================================================================
// SERVICES RESOLVER
// ============================================================================

export async function getResolvedServices(
  db?: SupabaseClient<Database> | null,
): Promise<ServiceItem[]> {
  const client = getSafeDbClient(db);
  if (!client) return SERVICES;

  try {
    const { data, error } = await client
      .from('services')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return SERVICES;
    }

    const isProd = isProductionEnvironment();
    const excludedSlugs = new Set<string>();
    const publishedServices: ServiceItem[] = [];

    for (const item of data) {
      const isDraftOrArchived = item.status === 'DRAFT' || item.status === 'ARCHIVED';
      const isInternal = item.visibility === 'INTERNAL';
      const isUnapprovedClaim =
        item.claim_status === 'UNVERIFIED' || item.claim_status === 'RETIRED';
      const isUnsafeDemoInProd = isProd && Boolean(item.demo_content);

      if (isDraftOrArchived || isInternal || isUnapprovedClaim || isUnsafeDemoInProd) {
        excludedSlugs.add(item.slug);
        continue;
      }

      if (item.status === 'PUBLISHED' && item.visibility === 'PUBLIC') {
        const bodyObj = (item.body || {}) as Record<string, unknown>;
        const staticMatch = SERVICES.find((s) => s.slug === item.slug);
        publishedServices.push({
          slug: item.slug as ServiceItem['slug'],
          title: item.title,
          tagline: item.seo_description || staticMatch?.tagline || 'End-to-end digital excellence.',
          description: item.summary || item.seo_description || staticMatch?.description || '',
          capabilities: Array.isArray(bodyObj.capabilities)
            ? (bodyObj.capabilities as { title: string; detail: string }[])
            : staticMatch?.capabilities || [],
          process: Array.isArray(bodyObj.process)
            ? (bodyObj.process as { step: string; title: string; description: string }[])
            : staticMatch?.process || [],
          deliverables: Array.isArray(bodyObj.deliverables)
            ? (bodyObj.deliverables as string[])
            : staticMatch?.deliverables || [],
        });
      }
    }

    const publishedSlugs = new Set(publishedServices.map((s) => s.slug));
    const mergedStatic = SERVICES.filter(
      (s) => !excludedSlugs.has(s.slug) && !publishedSlugs.has(s.slug),
    );

    return [...publishedServices, ...mergedStatic];
  } catch {
    return SERVICES;
  }
}

export async function getResolvedServiceBySlug(
  slug: string,
  db?: SupabaseClient<Database> | null,
): Promise<ServiceItem | null> {
  const all = await getResolvedServices(db);
  return all.find((s) => s.slug === slug) ?? null;
}

// ============================================================================
// INSIGHTS RESOLVER
// ============================================================================

function parseInsightBody(
  body: unknown,
  fallbackSummary?: string | null,
): { heading: string; paragraphs: string[] }[] {
  if (
    Array.isArray(body) &&
    body.length > 0 &&
    typeof body[0] === 'object' &&
    body[0] !== null &&
    'heading' in body[0]
  ) {
    return body as { heading: string; paragraphs: string[] }[];
  }
  if (
    typeof body === 'object' &&
    body !== null &&
    'paragraphs' in body &&
    Array.isArray((body as Record<string, unknown>).paragraphs)
  ) {
    const rawObj = body as Record<string, unknown>;
    return [
      {
        heading: (rawObj.heading as string) || 'Core Architecture',
        paragraphs: rawObj.paragraphs as string[],
      },
    ];
  }
  if (typeof body === 'string' && body.trim().length > 0) {
    return [{ heading: 'Core Architecture', paragraphs: [body] }];
  }
  return [
    {
      heading: 'Core Architecture',
      paragraphs: [
        fallbackSummary ||
          'Rigorous systems engineering and restrained aesthetic execution deliver lasting business value.',
      ],
    },
  ];
}

export async function getResolvedInsights(
  db?: SupabaseClient<Database> | null,
): Promise<InsightItem[]> {
  const client = getSafeDbClient(db);
  if (!client) return INSIGHTS;

  try {
    const { data, error } = await client
      .from('insights')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return INSIGHTS;
    }

    const isProd = isProductionEnvironment();
    const excludedSlugs = new Set<string>();
    const publishedInsights: InsightItem[] = [];

    for (const item of data) {
      const isDraftOrArchived = item.status === 'DRAFT' || item.status === 'ARCHIVED';
      const isInternal = item.visibility === 'INTERNAL';
      const isUnapprovedClaim =
        item.claim_status === 'UNVERIFIED' || item.claim_status === 'RETIRED';
      const isUnsafeDemoInProd = isProd && Boolean(item.demo_content);

      if (isDraftOrArchived || isInternal || isUnapprovedClaim || isUnsafeDemoInProd) {
        excludedSlugs.add(item.slug);
        continue;
      }

      if (item.status === 'PUBLISHED' && item.visibility === 'PUBLIC') {
        const abstract =
          typeof item.body === 'object' && item.body && 'abstract' in item.body
            ? String((item.body as Record<string, unknown>).abstract)
            : '';
        publishedInsights.push({
          slug: item.slug,
          title: item.title,
          category: item.category || 'Architecture & Strategy',
          date: item.published_at
            ? new Date(item.published_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })
            : '2026',
          readTime: item.read_time_minutes ? `${item.read_time_minutes} min read` : '5 min read',
          excerpt: abstract || item.seo_description || '',
          content: parseInsightBody(item.body, abstract || item.seo_description),
        });
      }
    }

    const publishedSlugs = new Set(publishedInsights.map((i) => i.slug));
    const mergedStatic = INSIGHTS.filter(
      (i) => !excludedSlugs.has(i.slug) && !publishedSlugs.has(i.slug),
    );

    return [...publishedInsights, ...mergedStatic];
  } catch {
    return INSIGHTS;
  }
}

export async function getResolvedInsightBySlug(
  slug: string,
  db?: SupabaseClient<Database> | null,
): Promise<InsightItem | null> {
  const all = await getResolvedInsights(db);
  return all.find((i) => i.slug === slug) ?? null;
}

// ============================================================================
// LAB PROJECTS RESOLVER
// ============================================================================

export async function getResolvedLabProjects(
  db?: SupabaseClient<Database> | null,
): Promise<LabItem[]> {
  const client = getSafeDbClient(db);
  if (!client) return LAB_ITEMS;

  try {
    const { data, error } = await client
      .from('lab_projects')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return LAB_ITEMS;
    }

    const isProd = isProductionEnvironment();
    const excludedSlugs = new Set<string>();
    const publishedLabItems: LabItem[] = [];

    for (const item of data) {
      const isDraftOrArchived = item.status === 'DRAFT' || item.status === 'ARCHIVED';
      const isInternal = item.visibility === 'INTERNAL';
      const isUnapprovedClaim =
        item.claim_status === 'UNVERIFIED' || item.claim_status === 'RETIRED';
      const isUnsafeDemoInProd = isProd && Boolean(item.demo_content);

      if (isDraftOrArchived || isInternal || isUnapprovedClaim || isUnsafeDemoInProd) {
        excludedSlugs.add(item.slug);
        continue;
      }

      if (item.status === 'PUBLISHED' && item.visibility === 'PUBLIC') {
        const bodyObj = (item.body || {}) as Record<string, unknown>;
        publishedLabItems.push({
          slug: item.slug,
          title: item.title,
          category: 'Experimental Engineering',
          status: 'ACTIVE_PROTOTYPE',
          description: item.summary || item.seo_description || '',
          hypothesis:
            typeof bodyObj.hypothesis === 'string'
              ? bodyObj.hypothesis
              : 'Deterministic systems outperform ad-hoc animations and unvalidated third-party scripts.',
          findings:
            typeof bodyObj.findings === 'string'
              ? bodyObj.findings
              : 'Zero layout shifts, sub-16ms frame times, and strict keyboard focus preservation.',
          stack: Array.isArray(bodyObj.stack)
            ? (bodyObj.stack as string[])
            : ['Next.js', 'TypeScript', 'PostgreSQL'],
        });
      }
    }

    const publishedSlugs = new Set(publishedLabItems.map((l) => l.slug));
    const mergedStatic = LAB_ITEMS.filter(
      (l) => !excludedSlugs.has(l.slug) && !publishedSlugs.has(l.slug),
    );

    return [...publishedLabItems, ...mergedStatic];
  } catch {
    return LAB_ITEMS;
  }
}

export async function getResolvedLabProjectBySlug(
  slug: string,
  db?: SupabaseClient<Database> | null,
): Promise<LabItem | null> {
  const all = await getResolvedLabProjects(db);
  return all.find((l) => l.slug === slug) ?? null;
}
