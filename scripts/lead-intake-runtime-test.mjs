import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey)
  throw new Error('Lead intake integration requires local Supabase credentials.');
const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const userAgent = `packet09-runtime-${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function jarRequest(jar, path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('origin', webUrl);
  headers.set('user-agent', userAgent);
  if (jar.size)
    headers.set('cookie', [...jar].map(([name, value]) => `${name}=${value}`).join('; '));
  return fetch(`${webUrl}${path}`, { ...options, headers }).then(async (response) => {
    const values =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const value of values) {
      const pair = value.split(';', 1)[0];
      const index = pair.indexOf('=');
      if (index < 1) continue;
      const name = pair.slice(0, index);
      const cookieValue = pair.slice(index + 1);
      if (!cookieValue || /max-age=0|expires=thu, 01 jan 1970/i.test(value)) jar.delete(name);
      else jar.set(name, cookieValue);
    }
    return response;
  });
}
function post(jar, path, body) {
  return jarRequest(jar, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
async function body(response) {
  return response.json();
}
async function count(table, column, value) {
  const result = await db.from(table).select('*', { count: 'exact', head: true }).eq(column, value);
  if (result.error) throw result.error;
  return result.count ?? 0;
}
async function personByEmail(email) {
  const result = await db
    .from('people')
    .select(
      'id,primary_email,first_touch_source,latest_touch_source,do_not_contact,organization_id',
    )
    .eq('primary_email', email)
    .single();
  if (result.error) throw result.error;
  return result.data;
}

const created = {
  people: new Set(),
  visitors: new Set(),
  submissions: new Set(),
  organizations: new Set(),
};
const jars = [new Map(), new Map(), new Map(), new Map()];
try {
  const baseStart = {
    idempotencyKey: randomUUID(),
    formVersion: 'START_PROJECT_V1',
    name: 'Packet Nine Lead',
    email: 'packet-nine@example.test',
    company: 'Packet Nine Labs',
    website: 'https://packet-nine.example.test/path?x=1',
    role: 'Founder',
    services: ['website', 'brand'],
    goal: 'Launch a clearer digital presence for our next product.',
    budget: 'INR_3_7_LAKH',
    timing: 'ONE_TO_TWO_MONTHS',
    source: 'REFERRAL',
    honeypot: '',
  };
  const noAnalytics = await post(jars[0], '/api/forms/start-project', baseStart);
  const noAnalyticsBody = await body(noAnalytics);
  assert(noAnalytics.status === 201 && noAnalyticsBody.ok, 'no-consent project intake failed');
  const noAnalyticsSubmission = noAnalyticsBody.submissionId;
  created.submissions.add(noAnalyticsSubmission);
  const noAnalyticsPerson = await personByEmail(baseStart.email);
  created.people.add(noAnalyticsPerson.id);
  assert(
    (await count('anonymous_visitors', 'linked_person_id', noAnalyticsPerson.id)) === 0,
    'no-consent intake fabricated visitor history',
  );
  assert(
    (await count('opportunities', 'person_id', noAnalyticsPerson.id)) === 1,
    'project did not create opportunity',
  );
  assert(
    (await count('tasks', 'person_id', noAnalyticsPerson.id)) === 1,
    'project did not create task',
  );
  assert(
    (await count('touchpoints', 'person_id', noAnalyticsPerson.id)) === 1,
    'project did not create touchpoint',
  );
  const duplicate = await post(jars[0], '/api/forms/start-project', baseStart);
  const duplicateBody = await body(duplicate);
  assert(
    duplicate.status === 200 && duplicateBody.submissionId === noAnalyticsSubmission,
    'idempotent retry did not return original submission',
  );
  assert(
    (await count('people', 'primary_email', baseStart.email)) === 1,
    'idempotent retry created a duplicate person',
  );
  assert(
    (await count('email_outbox', 'submission_id', noAnalyticsSubmission)) === 2,
    'expected confirmation and internal outbox jobs',
  );

  const consent = await post(jars[1], '/api/analytics/consent', {
    state: 'ANALYTICS_ALLOWED',
    source: 'runtime_test',
  });
  assert(consent.ok, 'analytics consent setup failed');
  jars[1].set('zv_vid', randomUUID());
  const analyticsEvent = await post(jars[1], '/api/analytics/events', {
    context: { pagePath: '/', utmSource: 'Instagram' },
    events: [
      {
        id: randomUUID(),
        name: 'page_viewed',
        occurredAt: new Date().toISOString(),
        pagePath: '/',
      },
    ],
  });
  assert(analyticsEvent.status === 202, 'analytics visitor setup failed');
  const visitorKey = jars[1].get('zv_vid');
  const visitor = await db
    .from('anonymous_visitors')
    .select('id')
    .eq('visitor_key', visitorKey)
    .single();
  if (visitor.error) throw visitor.error;
  created.visitors.add(visitor.data.id);
  await db
    .from('anonymous_visitors')
    .update({ first_source: 'instagram', last_source: 'google' })
    .eq('id', visitor.data.id);
  const linkedStart = {
    ...baseStart,
    idempotencyKey: randomUUID(),
    email: 'linked@example.test',
    name: 'Linked Visitor',
    company: 'Linked Labs',
  };
  const linkedResponse = await post(jars[1], '/api/forms/start-project', linkedStart);
  const linkedBody = await body(linkedResponse);
  assert(linkedResponse.status === 201 && linkedBody.ok, 'analytics-linked project intake failed');
  const linkedPerson = await personByEmail(linkedStart.email);
  created.people.add(linkedPerson.id);
  assert(
    (await count('anonymous_visitors', 'linked_person_id', linkedPerson.id)) === 1,
    'visitor was not linked to resolved person',
  );
  assert(
    linkedPerson.first_touch_source === 'instagram' &&
      linkedPerson.latest_touch_source === 'google',
    'first/latest attribution was not preserved',
  );
  assert(
    (await count('events', 'person_id', linkedPerson.id)) >= 1,
    'historical event was not backfilled to person',
  );

  const repeatContact = {
    idempotencyKey: randomUUID(),
    formVersion: 'CONTACT_V1',
    name: 'Packet Nine Lead',
    email: baseStart.email,
    company: '',
    website: '',
    role: '',
    message: 'A genuine follow-up enquiry.',
    honeypot: '',
  };
  const repeatResponse = await post(jars[2], '/api/forms/contact', repeatContact);
  assert(repeatResponse.status === 201, 'existing-person contact intake failed');
  assert(
    (await count('people', 'primary_email', baseStart.email)) === 1,
    'same-email repeat created duplicate person',
  );
  assert(
    (await count('identities', 'email', baseStart.email)) === 1,
    'same-email repeat created duplicate email identity',
  );

  const concurrentPayloads = [0, 1].map((index) => ({
    ...repeatContact,
    idempotencyKey: randomUUID(),
    name: `Concurrent ${index}`,
    email: 'case-race@example.test',
    message: 'Concurrent enquiry.',
  }));
  const concurrentResponses = await Promise.all(
    concurrentPayloads.map((payload) => post(jars[3], '/api/forms/contact', payload)),
  );
  assert(
    concurrentResponses.every((response) => response.status === 201),
    'concurrent same-email intake failed',
  );
  assert(
    (await count('people', 'primary_email', 'case-race@example.test')) === 1,
    'case-insensitive concurrent email created duplicate people',
  );
  const racePerson = await personByEmail('case-race@example.test');
  created.people.add(racePerson.id);

  const visitorConflict = new Map([
    ['zv_vid', visitorKey],
    ['zv_consent', jars[1].get('zv_consent')],
  ]);
  const personA = linkedPerson;
  const personBPayload = {
    ...repeatContact,
    idempotencyKey: randomUUID(),
    name: 'Different Person',
    email: 'different@example.test',
    message: 'This should not steal browser history.',
  };
  const conflictResponse = await post(visitorConflict, '/api/forms/contact', personBPayload);
  assert(conflictResponse.status === 201, 'ambiguous visitor submission failed');
  const personB = await personByEmail(personBPayload.email);
  created.people.add(personB.id);
  assert(
    (await count('identity_match_candidates', 'person_b', personB.id)) >= 1,
    'visitor/person conflict was not recorded',
  );
  const stillLinked = await db
    .from('anonymous_visitors')
    .select('linked_person_id')
    .eq('id', visitor.data.id)
    .single();
  assert(
    stillLinked.data?.linked_person_id === personA.id,
    'ambiguous visitor linkage was overwritten',
  );

  const beforeSpam = await count('people', 'primary_email', 'bot@example.test');
  const spam = await post(new Map(), '/api/forms/contact', {
    ...repeatContact,
    idempotencyKey: randomUUID(),
    email: 'bot@example.test',
    name: 'Bot',
    message: 'spam',
    honeypot: 'filled',
  });
  assert(
    spam.status === 202 &&
      (await count('people', 'primary_email', 'bot@example.test')) === beforeSpam,
    'honeypot created CRM state',
  );
  const invalid = await post(new Map(), '/api/forms/contact', {
    ...repeatContact,
    idempotencyKey: randomUUID(),
    email: 'not-an-email',
  });
  assert(invalid.status === 400, 'invalid payload was accepted');

  const messages = await fetch('http://127.0.0.1:54324/api/v1/messages').then((response) =>
    response.json(),
  );
  assert((messages.messages?.length ?? 0) >= 2, 'Mailpit did not receive transactional messages');
  console.log(
    'Packet 09 lead intake runtime passed: no-consent intake, analytics linking, attribution, existing-person reuse, idempotency, concurrency, conflict review, honeypot, validation, and Mailpit delivery.',
  );
} finally {
  for (const id of created.submissions)
    await db.from('email_outbox').delete().eq('submission_id', id);
  for (const id of created.submissions) await db.from('form_submissions').delete().eq('id', id);
  for (const id of created.people) {
    await db.from('identity_match_candidates').delete().or(`person_a.eq.${id},person_b.eq.${id}`);
    await db.from('lead_scores').delete().eq('person_id', id);
    await db.from('touchpoints').delete().eq('person_id', id);
    await db.from('tasks').delete().eq('person_id', id);
    await db.from('opportunities').delete().eq('person_id', id);
    await db.from('identities').delete().eq('person_id', id);
    await db.from('people').delete().eq('id', id);
  }
  for (const id of created.visitors) {
    await db.from('events').delete().eq('visitor_id', id);
    await db.from('sessions').delete().eq('visitor_id', id);
    await db.from('anonymous_visitors').delete().eq('id', id);
  }
}
