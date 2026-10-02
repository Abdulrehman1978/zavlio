#!/usr/bin/env node
const samples = [
  'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature',
  'cookie=session=abc',
  'SUPABASE_SERVICE_ROLE_KEY=sb_secret_example',
  'SMTP_PASSWORD=super-secret',
  'TURNSTILE_SECRET_KEY=secret',
  'social session cookie',
];
const keyPattern =
  /(authorization|cookie|password|token|secret|signature|service.?role|hmac|turnstile|smtp|session)/i;
const valuePattern =
  /(bearer\s+[a-z0-9._~+/=-]+|eyj[a-z0-9._-]+|sb_secret_[a-z0-9_-]+|sk_(?:live|test)_[a-z0-9_-]+)/i;
const redacted = (value, key = '') =>
  keyPattern.test(key) || valuePattern.test(value) ? '[REDACTED]' : value;
for (const sample of samples) {
  if (!redacted(sample).includes('[REDACTED]') && !redacted(sample, sample).includes('[REDACTED]'))
    throw new Error('redaction regression: ' + sample);
}
console.log(JSON.stringify({ status: 'PASS', cases: samples.length }));
