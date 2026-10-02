import { NextResponse } from 'next/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import { serverEnv } from '../../../../lib/env/server';

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const state = input.state;
  const source =
    typeof input.source === 'string' && /^[a-z_]{2,32}$/.test(input.source)
      ? input.source
      : 'cookie_ui';
  if (state !== 'ANALYTICS_ALLOWED' && state !== 'ANALYTICS_DENIED' && state !== 'WITHDRAWN')
    return NextResponse.json({ error: 'Invalid preference.' }, { status: 400 });
  const consentKey = crypto.randomUUID();
  const analytics = state === 'ANALYTICS_ALLOWED';
  const capturedAt = new Date().toISOString();
  const db = createAdminDatabaseClient();
  const { error } = await db.from('consents').insert({
    consent_key: consentKey,
    analytics,
    marketing_email: false,
    marketing_social: false,
    personalization: false,
    policy_version: serverEnv.ANALYTICS_POLICY_VERSION,
    source,
    captured_at: capturedAt,
    withdrawn_at: state === 'WITHDRAWN' ? capturedAt : null,
    metadata: { preference_only: true },
  });
  if (error) return NextResponse.json({ error: 'Unable to save preference.' }, { status: 503 });
  const response = NextResponse.json(
    { state, policyVersion: serverEnv.ANALYTICS_POLICY_VERSION },
    { status: 200 },
  );
  response.cookies.set(
    'zv_consent',
    `${analytics ? 'analytics_allowed' : 'analytics_denied'}|${consentKey}|${serverEnv.ANALYTICS_POLICY_VERSION}`,
    { ...cookieOptions, maxAge: serverEnv.ANALYTICS_VISITOR_TTL_DAYS * 86400 },
  );
  if (!analytics) {
    response.cookies.delete('zv_vid');
    response.cookies.delete('zv_sid');
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
