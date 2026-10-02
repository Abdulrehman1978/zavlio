import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminDatabaseClient } from '@zavlio/db/admin';
import {
  ANALYTICS_BATCH_MAX,
  ANALYTICS_BODY_MAX_BYTES,
  isUuid,
  normalizeSource,
  sanitizeContext,
  validateEvent,
  type AnalyticsContext,
  type TrackEvent,
} from '@zavlio/analytics';
import { publicEnv } from '../../../../lib/env/public';
import { serverEnv } from '../../../../lib/env/server';

const requestWindow = new Map<string, { startedAt: number; count: number }>();
const allowedOrigins = new Set([
  publicEnv.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3100',
]);

function json(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function parseConsent(value: string | undefined): {
  allowed: boolean;
  key?: string;
  policy?: string;
} {
  const parts = value?.split('|') ?? [];
  if (
    parts.length !== 3 ||
    (parts[0] !== 'analytics_allowed' && parts[0] !== 'analytics_denied') ||
    !isUuid(parts[1]) ||
    parts[2] !== serverEnv.ANALYTICS_POLICY_VERSION
  )
    return { allowed: false };
  return { allowed: parts[0] === 'analytics_allowed', key: parts[1], policy: parts[2] };
}

function checkOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.has(origin);
}

function throttle(key: string, count: number): boolean {
  const now = Date.now();
  const current = requestWindow.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    requestWindow.set(key, { startedAt: now, count });
    return true;
  }
  if (current.count + count > 120) return false;
  current.count += count;
  return true;
}

export async function POST(request: Request) {
  if (!checkOrigin(request)) return json({ accepted: 0 }, 403);
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > ANALYTICS_BODY_MAX_BYTES) return json({ accepted: 0 }, 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > ANALYTICS_BODY_MAX_BYTES)
    return json({ accepted: 0 }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ accepted: 0 }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ accepted: 0 }, 400);
  const input = body as Record<string, unknown>;
  if (
    !Array.isArray(input.events) ||
    input.events.length < 1 ||
    input.events.length > Math.min(ANALYTICS_BATCH_MAX, serverEnv.ANALYTICS_BATCH_MAX)
  )
    return json({ accepted: 0 }, 400);
  const eventInputs = input.events as unknown[];
  let context: AnalyticsContext;
  let events: TrackEvent[];
  try {
    context = sanitizeContext(input.context);
    events = eventInputs.map((event) => validateEvent(event));
  } catch {
    return json({ accepted: 0 }, 400);
  }
  if (events.some((event) => event.name === 'page_viewed' && !event.pagePath))
    return json({ accepted: 0 }, 202);
  const ids = new Set(events.map((event) => event.id));
  if (
    ids.size !== events.length ||
    !throttle(request.headers.get('user-agent')?.slice(0, 120) ?? 'unknown', events.length)
  )
    return json({ accepted: 0 }, 429);
  const cookieStore = await cookies();
  const consent = parseConsent(cookieStore.get('zv_consent')?.value);
  if (!consent.key)
    return json({ accepted: 0, reason: 'consent_required' }, consent.allowed ? 403 : 202);
  const db = createAdminDatabaseClient();
  const { data: preference } = await db
    .from('consents')
    .select('analytics,policy_version')
    .eq('consent_key', consent.key)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    !consent.allowed ||
    !preference?.analytics ||
    preference.policy_version !== serverEnv.ANALYTICS_POLICY_VERSION
  )
    return json({ accepted: 0, reason: 'consent_required' }, 202);
  const visitorCookie = cookieStore.get('zv_vid')?.value;
  const sessionCookie = cookieStore.get('zv_sid')?.value;
  if ((visitorCookie && !isUuid(visitorCookie)) || (sessionCookie && !isUuid(sessionCookie)))
    return json({ accepted: 0 }, 400);
  const visitorKey = visitorCookie ?? crypto.randomUUID();
  const firstPage = events.find((event) => event.pagePath)?.pagePath ?? context.pagePath;
  const now = new Date();
  if (
    events.some(
      (event) =>
        Date.parse(event.occurredAt) > now.getTime() + 10 * 60_000 ||
        Date.parse(event.occurredAt) < now.getTime() - 90 * 24 * 60 * 60_000,
    )
  )
    return json({ accepted: 0 }, 400);
  const { data: session, error: sessionError } = await db
    .rpc('ensure_analytics_session', {
      p_visitor_key: visitorKey,
      p_now: now.toISOString(),
      p_timeout: `${serverEnv.ANALYTICS_SESSION_TIMEOUT_MINUTES} minutes`,
      p_landing_page: firstPage ?? '/',
      p_referrer: context.referrer ?? '',
      p_utm_source: normalizeSource(context.utmSource, context.referrer),
      p_utm_medium: context.utmMedium ?? '',
      p_utm_campaign: context.utmCampaign ?? '',
      p_utm_term: context.utmTerm ?? '',
      p_utm_content: context.utmContent ?? '',
      p_device_category: context.deviceCategory ?? 'unknown',
      p_country: context.country ?? '',
    })
    .maybeSingle();
  if (sessionError || !session) return json({ accepted: 0 }, 503);
  const rows = events.map((event) => ({
    id: event.id,
    visitor_id: session.visitor_id,
    session_id: session.session_id,
    event_name: event.name,
    page_path: event.pagePath ?? context.pagePath ?? null,
    occurred_at: event.occurredAt,
    metadata: event.metadata,
    consent_snapshot: { analytics: true, policyVersion: serverEnv.ANALYTICS_POLICY_VERSION },
    request_id: crypto.randomUUID(),
  }));
  const { error: insertError } = await db
    .from('events')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (insertError) return json({ accepted: 0 }, 503);
  if (session.created_visitor)
    await db.from('consents').insert({
      visitor_id: session.visitor_id,
      analytics: true,
      marketing_email: false,
      marketing_social: false,
      personalization: false,
      policy_version: serverEnv.ANALYTICS_POLICY_VERSION,
      source: 'analytics_ingestion',
      captured_at: now.toISOString(),
      metadata: { linked_preference_key: consent.key },
    });
  const response = json(
    { accepted: events.length, visitorId: session.visitor_id, sessionId: session.session_id },
    202,
  );
  response.cookies.set('zv_vid', visitorKey, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: serverEnv.ANALYTICS_VISITOR_TTL_DAYS * 86400,
  });
  response.cookies.set('zv_sid', session.session_id, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: serverEnv.ANALYTICS_SESSION_TIMEOUT_MINUTES * 60,
  });
  return response;
}
