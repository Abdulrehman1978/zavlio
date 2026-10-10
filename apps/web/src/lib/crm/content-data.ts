import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';

export type ContentEntityType = 'projects' | 'services' | 'lab_projects' | 'insights';

export interface ContentItemRow {
  id: string;
  type: ContentEntityType;
  title: string;
  slug: string;
  summary: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'INTERNAL';
  claim_status: 'DEMO' | 'UNVERIFIED' | 'VERIFIED' | 'RETIRED' | null;
  demo_content: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentListResult {
  type: ContentEntityType;
  statusFilter: string;
  count: number;
  rows: ContentItemRow[];
}

export async function listContentItems(
  db: SupabaseClient<Database>,
  type: ContentEntityType = 'projects',
  status?: string,
  search?: string,
): Promise<ContentListResult> {
  const allowedTables: ContentEntityType[] = ['projects', 'services', 'lab_projects', 'insights'];
  const table = allowedTables.includes(type) ? type : 'projects';

  let query = db.from(table).select('*', { count: 'exact' });

  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())) {
    query = query.eq('status', status.toUpperCase());
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  query = query.order('updated_at', { ascending: false }).limit(100);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: ContentItemRow[] = (data || []).map((item) => {
    const raw = item as Record<string, unknown>;
    return {
      id: String(raw.id),
      type: table,
      title: String(raw.title || ''),
      slug: String(raw.slug || ''),
      summary: ((raw.summary as string) ||
        (typeof raw.body === 'object' && raw.body && 'abstract' in raw.body
          ? String((raw.body as Record<string, unknown>).abstract)
          : null) ||
        (raw.project_type as string) ||
        null) as string | null,
      status: (raw.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') || 'DRAFT',
      visibility: (raw.visibility as 'PUBLIC' | 'INTERNAL') || 'PUBLIC',
      claim_status: (raw.claim_status as ContentItemRow['claim_status']) || null,
      demo_content: Boolean(raw.demo_content),
      seo_title: (raw.seo_title as string) || null,
      seo_description: (raw.seo_description as string) || null,
      published_at: (raw.published_at as string) || null,
      created_at: String(raw.created_at || ''),
      updated_at: String(raw.updated_at || ''),
    };
  });

  return {
    type: table,
    statusFilter: status || 'all',
    count: count ?? rows.length,
    rows,
  };
}
