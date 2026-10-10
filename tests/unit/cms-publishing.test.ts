import { describe, expect, it, vi } from 'vitest';
import {
  getResolvedProjects,
  getResolvedProjectBySlug,
  getResolvedInsights,
  getResolvedInsightBySlug,
  getResolvedLabProjects,
  getResolvedServices,
} from '../../apps/web/src/lib/content-resolver';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

// Helper to mock Supabase client with specific data or errors
function createMockDbClient(tablesData: Record<string, unknown[]>) {
  return {
    from: vi.fn((tableName: string) => {
      const rows = tablesData[tableName] || [];
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: rows, error: null })),
          eq: vi.fn(() => Promise.resolve({ data: rows, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: rows.slice(0, 1), error: null })),
        })),
      };
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('CMS Publishing & Public Content Resolution Lifecycle', () => {
  it('enforces ZERO DRAFT LEAKAGE: Draft items in DB are completely omitted from public resolution', async () => {
    const mockDb = createMockDbClient({
      insights: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          slug: 'confidential-draft-article',
          title: 'Internal Confidential Draft',
          status: 'DRAFT',
          visibility: 'PUBLIC',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: null,
          body: { heading: 'Secret', paragraphs: ['Do not leak!'] },
        },
      ],
    });

    const publicInsights = await getResolvedInsights(mockDb);
    const draftItem = publicInsights.find((i) => i.slug === 'confidential-draft-article');
    expect(draftItem).toBeUndefined();

    const singleItem = await getResolvedInsightBySlug('confidential-draft-article', mockDb);
    expect(singleItem).toBeNull();
  });

  it('enforces ZERO ARCHIVED LEAKAGE: Archived items in DB are omitted from public routes', async () => {
    const mockDb = createMockDbClient({
      projects: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          slug: 'retired-case-study',
          title: 'Retired Case Study',
          status: 'ARCHIVED',
          visibility: 'PUBLIC',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const publicProjects = await getResolvedProjects(mockDb);
    expect(publicProjects.find((p) => p.slug === 'retired-case-study')).toBeUndefined();

    const single = await getResolvedProjectBySlug('retired-case-study', mockDb);
    expect(single).toBeNull();
  });

  it('suppresses static baseline items when an item with the same slug is ARCHIVED in DB', async () => {
    // 'kinetiq-systems' is a baseline static project.
    // If an administrator archives it in PostgreSQL, it must disappear from public routes!
    const mockDb = createMockDbClient({
      projects: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          slug: 'kinetiq-systems',
          title: 'Kinetiq Systems',
          status: 'ARCHIVED',
          visibility: 'PUBLIC',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const publicProjects = await getResolvedProjects(mockDb);
    expect(publicProjects.find((p) => p.slug === 'kinetiq-systems')).toBeUndefined();

    const single = await getResolvedProjectBySlug('kinetiq-systems', mockDb);
    expect(single).toBeNull();
  });

  it('enforces ZERO INTERNAL LEAKAGE: Internal visibility items are omitted from public routes', async () => {
    const mockDb = createMockDbClient({
      lab_projects: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          slug: 'internal-experiment-only',
          title: 'Internal Only Experiment',
          status: 'PUBLISHED',
          visibility: 'INTERNAL',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: '2026-01-01T00:00:00Z',
          body: { hypothesis: 'Internal only' },
        },
      ],
    });

    const publicLab = await getResolvedLabProjects(mockDb);
    expect(publicLab.find((l) => l.slug === 'internal-experiment-only')).toBeUndefined();
  });

  it('suppresses content with unapproved claims (UNVERIFIED or RETIRED)', async () => {
    const mockDb = createMockDbClient({
      insights: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          slug: 'unverified-claims-post',
          title: 'Unverified Post',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          claim_status: 'UNVERIFIED',
          demo_content: false,
          published_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '66666666-6666-4666-8666-666666666666',
          slug: 'retired-claims-post',
          title: 'Retired Post',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          claim_status: 'RETIRED',
          demo_content: false,
          published_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const publicInsights = await getResolvedInsights(mockDb);
    expect(publicInsights.find((i) => i.slug === 'unverified-claims-post')).toBeUndefined();
    expect(publicInsights.find((i) => i.slug === 'retired-claims-post')).toBeUndefined();
  });

  it('resolves published DB records and prepends them to public listings', async () => {
    const mockDb = createMockDbClient({
      insights: [
        {
          id: '77777777-7777-4777-8777-777777777777',
          slug: 'engineering-scale-2026',
          title: 'Engineering at Scale in 2026',
          category: 'Architecture',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: '2026-10-10T12:00:00Z',
          read_time_minutes: 7,
          seo_description: 'Architecting high-throughput deterministic systems.',
          body: {
            heading: 'System Invariants',
            paragraphs: ['Deterministic execution requires formal audit integrity.'],
          },
        },
      ],
    });

    const publicInsights = await getResolvedInsights(mockDb);
    const publishedItem = publicInsights.find((i) => i.slug === 'engineering-scale-2026');
    expect(publishedItem).toBeDefined();
    expect(publishedItem?.title).toBe('Engineering at Scale in 2026');
    expect(publishedItem?.readTime).toBe('7 min read');
    expect(publishedItem?.content[0].heading).toBe('System Invariants');

    // Also single slug resolver
    const single = await getResolvedInsightBySlug('engineering-scale-2026', mockDb);
    expect(single?.title).toBe('Engineering at Scale in 2026');
  });

  it('overrides static baseline records when an item with identical slug is PUBLISHED in DB', async () => {
    const mockDb = createMockDbClient({
      projects: [
        {
          id: '88888888-8888-4888-8888-888888888888',
          slug: 'kinetiq-systems',
          title: 'Kinetiq Systems — Production Overhaul',
          project_type: 'Live Design System',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          claim_status: 'VERIFIED',
          demo_content: false,
          published_at: '2026-10-10T00:00:00Z',
          results: {
            challenge: 'Real-time client telemetry.',
            approach: 'Vector canvas integration.',
            outcome: 'Zero CLS and sub-16ms frames.',
          },
        },
      ],
    });

    const publicProjects = await getResolvedProjects(mockDb);
    const item = publicProjects.find((p) => p.slug === 'kinetiq-systems');
    expect(item).toBeDefined();
    expect(item?.title).toBe('Kinetiq Systems — Production Overhaul');
    expect(item?.challenge).toBe('Real-time client telemetry.');
  });

  it('falls back safely to static baseline when database query returns error or throws', async () => {
    const errorDb = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.reject(new Error('PostgreSQL connection timeout'))),
        })),
      })),
    } as unknown as SupabaseClient<Database>;

    const projects = await getResolvedProjects(errorDb);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].slug).toBe('kinetiq-systems');

    const services = await getResolvedServices(errorDb);
    expect(services.length).toBe(4);
  });
});
