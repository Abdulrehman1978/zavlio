import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AppError } from '@zavlio/config';
import { POST } from '../../apps/web/src/app/api/crm/content/route';
import * as guards from '../../apps/web/src/lib/auth/guards';
import * as serverClient from '../../apps/web/src/lib/supabase/server';

function createMockSupabase(
  overrides: {
    existing?: unknown[];
    singleItem?: unknown;
    updateData?: unknown;
    insertData?: unknown;
    auditError?: unknown;
  } = {},
) {
  const tableQuery = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        neq: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: overrides.existing || [], error: null }),
        })),
        single: vi.fn().mockResolvedValue({
          data:
            overrides.singleItem !== undefined
              ? overrides.singleItem
              : { id: 'item-1', status: 'DRAFT', slug: 'item-1' },
          error: null,
        }),
      })),
      limit: vi.fn().mockResolvedValue({ data: overrides.existing || [], error: null }),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: overrides.updateData || { id: 'item-1', title: 'Updated' },
            error: null,
          }),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: overrides.insertData || { id: 'item-new', title: 'Created' },
          error: null,
        }),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return {
    from: vi.fn((tableName: string) => {
      if (tableName === 'audit_logs') {
        return {
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: overrides.auditError || null,
          }),
        };
      }
      return tableQuery;
    }),
    tableQuery,
  };
}

describe('CMS Mutation API & Audit Integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const defaultMock = createMockSupabase();
    vi.spyOn(serverClient, 'createServerSupabaseClient').mockResolvedValue(defaultMock as never);
  });

  it('rejects caller without minimum OPERATOR role', async () => {
    vi.spyOn(guards, 'requireMinimumRole').mockRejectedValueOnce(
      new AppError({
        code: 'FORBIDDEN',
        message: 'Active staff authorization is required.',
        status: 403,
      }),
    );

    const req = new Request('http://localhost:3000/api/crm/content', {
      method: 'POST',
      body: JSON.stringify({
        type: 'projects',
        title: 'New Project',
        slug: 'new-project',
        status: 'DRAFT',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Active staff authorization is required');
  });

  it('denies publication attempt if caller is only OPERATOR', async () => {
    // 1st call for OPERATOR succeeds; 2nd call for ADMIN fails
    vi.spyOn(guards, 'requireMinimumRole')
      .mockResolvedValueOnce({
        user: { id: 'usr-1' } as never,
        staff: { id: 'stf-1', role: 'OPERATOR' } as never,
      } as never)
      .mockRejectedValueOnce(
        new AppError({
          code: 'FORBIDDEN',
          message: 'Role ADMIN or higher is required.',
          status: 403,
        }),
      );

    const req = new Request('http://localhost:3000/api/crm/content', {
      method: 'POST',
      body: JSON.stringify({
        type: 'projects',
        title: 'Unauthorized Publication',
        slug: 'unauthorized-pub',
        status: 'PUBLISHED',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Role ADMIN or higher is required');
  });

  it('rejects publishing when claim_status is UNVERIFIED', async () => {
    vi.spyOn(guards, 'requireMinimumRole').mockResolvedValue({
      user: { id: 'usr-admin' } as never,
      staff: { id: 'stf-admin', role: 'ADMIN' } as never,
    } as never);

    const req = new Request('http://localhost:3000/api/crm/content', {
      method: 'POST',
      body: JSON.stringify({
        type: 'projects',
        title: 'Unverified Claim Project',
        slug: 'unverified-claim-project',
        status: 'PUBLISHED',
        claimStatus: 'UNVERIFIED',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('unapproved or retired claims');
  });

  it('rejects publishing demo content when in production environment', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    try {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';

      vi.spyOn(guards, 'requireMinimumRole').mockResolvedValue({
        user: { id: 'usr-admin' } as never,
        staff: { id: 'stf-admin', role: 'ADMIN' } as never,
      } as never);

      const req = new Request('http://localhost:3000/api/crm/content', {
        method: 'POST',
        body: JSON.stringify({
          type: 'projects',
          title: 'Demo Project in Prod',
          slug: 'demo-project-in-prod',
          status: 'PUBLISHED',
          demoContent: true,
          claimStatus: 'DEMO',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Cannot publish demo content in production environment');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.NEXT_PUBLIC_VERCEL_ENV = originalVercelEnv;
    }
  });

  it('enforces AUDIT INTEGRITY: rolls back updated row and returns 500 if audit_logs.insert fails', async () => {
    vi.spyOn(guards, 'requireMinimumRole').mockResolvedValue({
      user: { id: 'usr-admin' } as never,
      staff: { id: 'stf-admin', role: 'ADMIN' } as never,
    } as never);

    const priorState = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Original Title',
      slug: 'item-slug',
      status: 'DRAFT',
      published_at: null,
    };

    const rollbackSpy = vi.fn();
    let updateCallCount = 0;

    const mockSupabase = {
      from: vi.fn((tableName: string) => {
        if (tableName === 'insights') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                neq: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
                single: vi.fn().mockResolvedValue({ data: priorState, error: null }),
              })),
            })),
            update: vi.fn((payload) => {
              updateCallCount++;
              if (updateCallCount === 2) {
                rollbackSpy(payload);
                return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) };
              }
              return {
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: { ...priorState, title: 'Updated Title' },
                      error: null,
                    }),
                  })),
                })),
              };
            }),
          };
        }
        if (tableName === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Disk quota exceeded on audit log partition' },
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(serverClient, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as never);

    const req = new Request('http://localhost:3000/api/crm/content', {
      method: 'POST',
      body: JSON.stringify({
        id: '11111111-1111-4111-8111-111111111111',
        type: 'insights',
        title: 'Updated Title',
        slug: 'item-slug',
        status: 'DRAFT',
        visibility: 'PUBLIC',
      }),
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toContain('Audit log insertion failed');
    expect(rollbackSpy).toHaveBeenCalledWith(priorState);
  });
});
