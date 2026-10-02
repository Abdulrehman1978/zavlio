import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const webUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey)
  throw new Error('SMTP failure test requires local Supabase credentials.');

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = `packet09-failure-${Date.now()}@example.test`;
const idempotencyKey = randomUUID();
const payload = {
  name: 'Packet 09 Failure Check',
  email,
  company: 'Failure Check Co',
  website: 'https://failure-check.example.test',
  role: 'Founder',
  message: 'Verifies CRM state survives an email provider failure.',
  idempotencyKey,
  formVersion: 'CONTACT_V1',
  honeypot: '',
};

try {
  const response = await fetch(`${webUrl}/api/forms/contact`, {
    method: 'POST',
    headers: {
      origin: webUrl,
      'content-type': 'application/json',
      'user-agent': `packet09-email-failure-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (response.status !== 201 || !result.submissionId) {
    throw new Error(`Expected successful intake despite provider failure; got ${response.status}`);
  }
  const outbox = await db
    .from('email_outbox')
    .select('status,attempt_count,failure_reason')
    .eq('submission_id', result.submissionId);
  if (outbox.error) throw outbox.error;
  if (!outbox.data?.length || outbox.data.some((row) => row.status !== 'FAILED')) {
    throw new Error('Expected all confirmation/notification outbox jobs to be FAILED.');
  }
  console.log(
    'Packet 09 SMTP failure runtime passed: CRM transaction committed and outbox jobs were marked FAILED.',
  );
} finally {
  await db.from('form_submissions').delete().eq('idempotency_key', idempotencyKey);
  await db.from('people').delete().eq('primary_email', email);
}
