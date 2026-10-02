import { NextResponse } from 'next/server';
import { productionEnvironmentIssues } from '@zavlio/validation';

export const dynamic = 'force-dynamic';

export function GET() {
  const issues =
    process.env.NODE_ENV === 'production' ? productionEnvironmentIssues(process.env) : [];
  const ready = issues.length === 0 && process.env.LIVE_EXTERNAL_EXECUTION !== 'true';
  return NextResponse.json(
    {
      ready,
      checks: {
        process: 'ok',
        criticalConfig: issues.length === 0 ? 'ok' : 'degraded',
        database: 'unverified',
        bridge: 'independent',
        socialLive: 'disabled',
      },
      ...(issues.length > 0 ? { codes: issues.map((issue) => issue.variable) } : {}),
    },
    { status: ready ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
