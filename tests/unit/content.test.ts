import { describe, expect, it } from 'vitest';
import { contentItemCreateSchema, contentItemUpdateSchema } from '@zavlio/validation';
import {
  getResolvedProjects,
  getResolvedServices,
  getResolvedInsights,
  getResolvedLabProjects,
} from '../../apps/web/src/lib/content-resolver';

describe('CRM Content Management & Validation', () => {
  it('validates a valid content creation schema', () => {
    const validPayload = {
      type: 'projects' as const,
      title: 'Aurora Intelligence',
      slug: 'aurora-intelligence',
      summary: 'An exploratory operator workspace for supervising autonomous agent clusters.',
      status: 'DRAFT' as const,
      visibility: 'PUBLIC' as const,
      claimStatus: 'DEMO' as const,
      demoContent: true,
      seoTitle: 'Aurora Intelligence | Zavlio Case Study',
      seoDescription: 'Supervising autonomous agent clusters with strict permission boundaries.',
    };

    const parsed = contentItemCreateSchema.parse(validPayload);
    expect(parsed.title).toBe('Aurora Intelligence');
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.demoContent).toBe(true);
  });

  it('rejects invalid slugs with uppercase or special characters', () => {
    const invalidPayload = {
      type: 'projects' as const,
      title: 'Invalid Slug Project',
      slug: 'Invalid Slug With Spaces!',
      status: 'DRAFT' as const,
      visibility: 'PUBLIC' as const,
      demoContent: true,
    };

    expect(() => contentItemCreateSchema.parse(invalidPayload)).toThrow();
  });

  it('validates content update schema with id', () => {
    const updatePayload = {
      id: '11111111-1111-4111-8111-111111111111',
      type: 'projects' as const,
      title: 'Updated Title',
      slug: 'updated-title',
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const,
      demoContent: false,
    };

    const parsed = contentItemUpdateSchema.parse(updatePayload);
    expect(parsed.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(parsed.status).toBe('PUBLISHED');
  });

  it('resolves fallback static projects when db is null', async () => {
    const projects = await getResolvedProjects(null);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].slug).toBe('kinetiq-systems');
    expect(projects.every((p) => p.slug && p.title)).toBe(true);
  });

  it('resolves fallback services, insights, and lab projects', async () => {
    const services = await getResolvedServices(null);
    expect(services.length).toBe(4);
    expect(services.map((s) => s.slug)).toEqual(['strategy', 'design', 'technology', 'growth']);

    const insights = await getResolvedInsights(null);
    expect(insights.length).toBe(3);

    const lab = await getResolvedLabProjects(null);
    expect(lab.length).toBe(3);
  });
});
