import 'server-only';

import { createLogger } from '@zavlio/config';
import type { Json } from '@zavlio/db/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@zavlio/db/database.types';
import { serverEnv } from '../env/server';

const logger = createLogger('crm-analytics');
type Db = SupabaseClient<Database>;
export type ReportKey = 'overview' | 'acquisition' | 'leads' | 'pipeline' | 'operations';

function object(value: Json): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid report response.');
  return value as Record<string, unknown>;
}

export async function loadAnalyticsReport(
  db: Db,
  reportKey: ReportKey,
  range: { start: string; end: string; previousStart: string; previousEnd: string; days: number },
) {
  const started = performance.now();
  const response =
    reportKey === 'overview'
      ? await db.rpc('crm_analytics_overview', {
          p_start: range.start,
          p_end: range.end,
          p_previous_start: range.previousStart,
          p_previous_end: range.previousEnd,
        })
      : reportKey === 'acquisition'
        ? await db.rpc('crm_analytics_acquisition', { p_start: range.start, p_end: range.end })
        : reportKey === 'leads'
          ? await db.rpc('crm_analytics_leads', { p_start: range.start, p_end: range.end })
          : reportKey === 'pipeline'
            ? await db.rpc('crm_analytics_pipeline', { p_start: range.start, p_end: range.end })
            : await db.rpc('crm_analytics_operations', { p_start: range.start, p_end: range.end });
  if (response.error) throw response.error;
  const durationMs = Math.round((performance.now() - started) * 10) / 10;
  logger.log(
    durationMs > serverEnv.CRM_ANALYTICS_SLOW_QUERY_MS ? 'warn' : 'info',
    'REPORT_QUERY_COMPLETED',
    {
      reportKey,
      durationMs,
      rangeDays: range.days,
    },
  );
  return object(response.data);
}
