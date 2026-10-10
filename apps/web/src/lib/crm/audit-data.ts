import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@zavlio/db/database.types';

export interface AuditLogRow {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Json | null;
  after_state: Json | null;
  ip_hash: string | null;
  request_id: string | null;
  created_at: string;
}

const SENSITIVE_KEY_PATTERN = /password|token|secret|hmac|cookie|auth|session|api_?key/i;

export function redactAuditPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactAuditPayload);

  const redacted: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      redacted[key] = redactAuditPayload(val);
    } else {
      redacted[key] = val;
    }
  }
  return redacted;
}

export async function listAuditLogs(
  db: SupabaseClient<Database>,
  action?: string,
  entityType?: string,
  page = 1,
  pageSize = 50,
): Promise<{ count: number; rows: AuditLogRow[]; page: number; totalPages: number }> {
  let query = db.from('audit_logs').select('*', { count: 'exact' });

  if (action && action.trim().length > 0) {
    query = query.ilike('action', `%${action.trim()}%`);
  }

  if (entityType && entityType.trim().length > 0) {
    query = query.eq('entity_type', entityType.trim());
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count ?? 0;
  const rows: AuditLogRow[] = (data || []).map((row) => ({
    id: row.id,
    actor_type: row.actor_type,
    actor_id: row.actor_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    before_state: (redactAuditPayload(row.before_state) as Json) || null,
    after_state: (redactAuditPayload(row.after_state) as Json) || null,
    ip_hash: row.ip_hash,
    request_id: row.request_id,
    created_at: row.created_at,
  }));

  return {
    count: totalCount,
    rows,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}
