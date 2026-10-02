#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.next', 'dist', 'coverage', 'test-results']);
const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) continue;
    const absolute = path.join(directory, entry);
    const relative = path.relative(root, absolute);
    if (statSync(absolute).isDirectory()) walk(absolute);
    else if (!relative.startsWith('external/meta-automation/logs/')) files.push(relative);
  }
};
walk(root);
const risky = [
  /(?:SUPABASE_SERVICE_ROLE_KEY|SMTP_PASSWORD|TURNSTILE_SECRET_KEY|ZAVLIO_MACHINE_HMAC_SECRET|AUTOMATION_MACHINE_KEYS_JSON)[ \t]*[:=][ \t]*['"]?(?!['"]?$|<|>|\$\{)[A-Za-z0-9._+=/-]{20,}/i,
  /(?:sb_secret_|sk_live_|sk_test_)(?!example|placeholder)[A-Za-z0-9_-]{12,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
];
const findings = [];
for (const file of files) {
  const normalized = file.replaceAll('\\', '/');
  if (
    normalized === '.env.example' ||
    normalized.endsWith('.lock.json') ||
    normalized === 'MASTER_SPEC.md' ||
    normalized.startsWith('tests/') ||
    normalized.startsWith('docs/') ||
    normalized === 'scripts/log-redaction-test.mjs' ||
    normalized === 'scripts/meta-adapter-runtime-test.mjs' ||
    normalized.startsWith('supabase/.temp/')
  )
    continue;
  const content = readFileSync(path.join(root, file), 'utf8');
  for (const pattern of risky) if (pattern.test(content)) findings.push(file);
}
if (findings.length > 0) {
  console.error(JSON.stringify({ status: 'FAIL', findings: [...new Set(findings)] }));
  process.exitCode = 1;
} else console.log(JSON.stringify({ status: 'PASS', filesScanned: files.length }));
