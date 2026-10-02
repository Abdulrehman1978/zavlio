#!/usr/bin/env node
const mode = process.argv[2] ?? process.env.NODE_ENV ?? 'development';
const input = { ...process.env, NODE_ENV: mode };
const truthy = (value) => value === true || value === 'true';
const present = (value) => typeof value === 'string' && value.trim().length > 0;
const localHost = (value) => {
  if (!present(value)) return false;
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(String(value)).hostname);
  } catch {
    return /^(localhost|127\.0\.0\.1|\[::1\])/.test(String(value));
  }
};
const productionIssues = () => {
  const issues = [];
  const requireValue = (variable) => {
    if (!present(input[variable])) issues.push(variable);
  };
  [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_PROJECT_ID',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MAIL_FROM',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  ].forEach(requireValue);
  if (!present(input.SMTP_HOST) && !present(input.ZOHO_SMTP_HOST))
    issues.push('SMTP_HOST/ZOHO_SMTP_HOST');
  if (!present(input.SMTP_USER) && !present(input.ZOHO_SMTP_USER))
    issues.push('SMTP_USER/ZOHO_SMTP_USER');
  if (!present(input.SMTP_PASSWORD) && !present(input.ZOHO_SMTP_PASSWORD))
    issues.push('SMTP_PASSWORD/ZOHO_SMTP_PASSWORD');
  if (input.CONTENT_MODE !== 'production') issues.push('CONTENT_MODE');
  if (!truthy(input.TURNSTILE_ENABLED)) issues.push('TURNSTILE_ENABLED');
  if (truthy(input.LIVE_EXTERNAL_EXECUTION)) issues.push('LIVE_EXTERNAL_EXECUTION');
  if (localHost(input.NEXT_PUBLIC_SITE_URL) || localHost(input.NEXT_PUBLIC_SUPABASE_URL))
    issues.push('localhost-url');
  const smtpHost = present(input.SMTP_HOST) ? input.SMTP_HOST : input.ZOHO_SMTP_HOST;
  if (localHost(smtpHost) || present(input.MAILPIT_URL) || input.SMTP_SECURE !== 'true')
    issues.push('SMTP_HOST/SMTP_SECURE');
  return issues;
};
const issues =
  mode === 'production'
    ? productionIssues().map((variable) => ({ variable }))
    : mode === 'bridge'
      ? [
          ...(input.ZAVLIO_MACHINE_HMAC_SECRET ? [] : [{ variable: 'ZAVLIO_MACHINE_HMAC_SECRET' }]),
          ...(input.ZAVLIO_CONTROL_PLANE_URL ? [] : [{ variable: 'ZAVLIO_CONTROL_PLANE_URL' }]),
          ...(input.ZAVLIO_EXECUTOR_MODE === 'DRY_RUN_ONLY'
            ? []
            : [{ variable: 'ZAVLIO_EXECUTOR_MODE' }]),
          ...(input.SUPABASE_SERVICE_ROLE_KEY ? [{ variable: 'SUPABASE_SERVICE_ROLE_KEY' }] : []),
        ]
      : [];
if (issues.length > 0) {
  console.error(
    JSON.stringify({
      status: 'FAIL',
      mode,
      issues: issues.map((issue) => issue.variable),
    }),
  );
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'PASS', mode, liveExternalExecution: false }));
}
