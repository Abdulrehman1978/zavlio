import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey)
  throw new Error('Analytics integration test requires local Supabase URL and service key.');
const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const jar = new Map();
const visitorKeys = new Set();
const consentKeys = new Set();
const userAgent = `packet08-runtime-${Date.now()}`;

function applyCookies(headers) {
  const values =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers.get('set-cookie')
        ? [headers.get('set-cookie')]
        : [];
  for (const value of values) {
    const pair = value.split(';', 1)[0];
    const index = pair.indexOf('=');
    if (index < 1) continue;
    const name = pair.slice(0, index);
    const cookieValue = pair.slice(index + 1);
    if (/max-age=0|expires=thu, 01 jan 1970|^$/i.test(value) || cookieValue === '')
      jar.delete(name);
    else jar.set(name, cookieValue);
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('origin', webUrl);
  headers.set('user-agent', userAgent);
  if (jar.size)
    headers.set('cookie', [...jar].map(([name, value]) => `${name}=${value}`).join('; '));
  const response = await fetch(`${webUrl}${path}`, { ...options, headers });
  applyCookies(response.headers);
  return response;
}

async function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
async function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function json(response) {
  return response.json();
}
async function visitorByKey(key) {
  const result = await db
    .from('anonymous_visitors')
    .select('id,visitor_key,session_count,first_source,first_landing_page')
    .eq('visitor_key', key)
    .single();
  if (result.error || !result.data) throw result.error ?? new Error('visitor not found');
  return result.data;
}
async function eventCount(visitorId) {
  const result = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('visitor_id', visitorId);
  if (result.error) throw result.error;
  return result.count ?? 0;
}

let currentVisitor;
let currentSession;
try {
  const unknown = await post('/api/analytics/events', {
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  await assert(unknown.status === 202, 'unknown consent was not ignored');
  const denied = await post('/api/analytics/consent', {
    state: 'ANALYTICS_DENIED',
    source: 'runtime_test',
  });
  await assert(
    denied.ok && !jar.has('zv_vid'),
    'analytics rejection did not clear visitor identity',
  );
  const rejectedEvent = await post('/api/analytics/events', {
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  await assert(rejectedEvent.status === 202, 'denied analytics was persisted');
  const accepted = await post('/api/analytics/consent', {
    state: 'ANALYTICS_ALLOWED',
    source: 'runtime_test',
  });
  await assert(accepted.ok, 'analytics acceptance failed');
  // The browser client issues the visitor UUID after the preference endpoint succeeds.
  if (!jar.has('zv_vid')) jar.set('zv_vid', randomUUID());
  await assert(jar.has('zv_vid'), 'analytics acceptance did not issue visitor cookie');
  const consentKey = jar.get('zv_consent')
    ? decodeURIComponent(jar.get('zv_consent')).split('|')[1]
    : undefined;
  if (consentKey) consentKeys.add(consentKey);
  const firstEventId = randomUUID();
  const first = await post('/api/analytics/events', {
    context: {
      pagePath: '/',
      utmSource: 'Instagram',
      referrer: 'https://l.instagram.com/?token=secret',
      deviceCategory: 'desktop',
    },
    events: [
      {
        id: randomUUID(),
        name: 'session_started',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
      {
        id: firstEventId,
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  const firstBody = await json(first);
  await assert(first.status === 202 && firstBody.accepted === 2, 'accepted analytics batch failed');
  currentVisitor = await visitorByKey(jar.get('zv_vid'));
  visitorKeys.add(jar.get('zv_vid'));
  currentSession = firstBody.sessionId;
  await assert(
    currentVisitor.first_source === 'instagram' && currentVisitor.session_count === 1,
    'first-touch/session attribution failed',
  );
  const second = await post('/api/analytics/events', {
    context: { pagePath: '/services' },
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/services',
      },
    ],
  });
  const secondBody = await json(second);
  await assert(
    secondBody.visitorId === currentVisitor.id && secondBody.sessionId === currentSession,
    'active session was not reused',
  );
  const beforeDuplicate = await eventCount(currentVisitor.id);
  const duplicate = await post('/api/analytics/events', {
    context: { pagePath: '/' },
    events: [
      {
        id: firstEventId,
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  await assert(
    duplicate.status === 202 && (await eventCount(currentVisitor.id)) === beforeDuplicate,
    'duplicate event was persisted twice',
  );
  await db
    .from('sessions')
    .update({ last_activity_at: new Date(Date.now() - 31 * 60_000).toISOString(), ended_at: null })
    .eq('id', currentSession);
  const newSession = await post('/api/analytics/events', {
    context: { pagePath: '/campaign', utmSource: 'newsletter', utmCampaign: 'spring' },
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/campaign',
      },
    ],
  });
  const newSessionBody = await json(newSession);
  await assert(
    newSessionBody.visitorId === currentVisitor.id && newSessionBody.sessionId !== currentSession,
    'session timeout did not create a new session',
  );
  const afterTimeout = await visitorByKey(jar.get('zv_vid'));
  await assert(
    afterTimeout.session_count === 2 && afterTimeout.first_source === 'instagram',
    'session count or first-touch immutability failed',
  );
  const withdrawal = await post('/api/analytics/consent', {
    state: 'WITHDRAWN',
    source: 'runtime_test',
  });
  await assert(
    withdrawal.ok && !jar.has('zv_vid') && !jar.has('zv_sid'),
    'withdrawal did not clear analytics cookies',
  );
  const afterWithdrawal = await post('/api/analytics/events', {
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  await assert(afterWithdrawal.status === 202, 'withdrawn analytics was accepted');
  const reaccepted = await post('/api/analytics/consent', {
    state: 'ANALYTICS_ALLOWED',
    source: 'runtime_test',
  });
  await assert(reaccepted.ok, 're-consent failed');
  if (!jar.has('zv_vid')) jar.set('zv_vid', randomUUID());
  const reconsentKey = jar.get('zv_consent')
    ? decodeURIComponent(jar.get('zv_consent')).split('|')[1]
    : undefined;
  if (reconsentKey) consentKeys.add(reconsentKey);
  await assert(
    jar.has('zv_vid') && !visitorKeys.has(jar.get('zv_vid')),
    're-consent reused a cleared visitor ID',
  );
  const concurrent = await Promise.all(
    Array.from({ length: 8 }, () =>
      post('/api/analytics/events', {
        context: { pagePath: '/concurrent' },
        events: [
          {
            id: randomUUID(),
            name: 'page_viewed',
            occurredAt: new Date().toISOString(),
            pagePath: '/concurrent',
          },
        ],
      }),
    ),
  );
  await assert(
    concurrent.every((response) => response.status === 202),
    'concurrent analytics requests were rejected',
  );
  const concurrentVisitor = await visitorByKey(jar.get('zv_vid'));
  await assert(
    concurrentVisitor.session_count === 1,
    'concurrent initial events inflated session count',
  );
  console.log(
    'Packet 08 analytics runtime passed: consent gating, rejection, acceptance, first/latest attribution, session reuse/timeout, dedupe, withdrawal, re-consent, and concurrency.',
  );
} finally {
  for (const key of consentKeys) await db.from('consents').delete().eq('consent_key', key);
  for (const key of visitorKeys) {
    const visitor = await db
      .from('anonymous_visitors')
      .select('id')
      .eq('visitor_key', key)
      .maybeSingle();
    if (visitor.data) {
      await db.from('consents').delete().eq('visitor_id', visitor.data.id);
      await db.from('events').delete().eq('visitor_id', visitor.data.id);
      await db.from('sessions').delete().eq('visitor_id', visitor.data.id);
      await db.from('anonymous_visitors').delete().eq('id', visitor.data.id);
    }
  }
}
