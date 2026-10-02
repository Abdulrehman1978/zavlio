const truthy = (value: unknown): boolean => value === true || value === 'true';
const present = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;
const localHost = (value: unknown): boolean => {
  if (!present(value)) return false;
  try {
    const hostname = new URL(String(value)).hostname;
    return ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return /^(localhost|127\.0\.0\.1|\[::1\])/.test(String(value));
  }
};

export type ProductionEnvironmentIssue = Readonly<{
  variable: string;
  reason: string;
}>;

export function productionEnvironmentIssues(
  input: Record<string, unknown>,
): ProductionEnvironmentIssue[] {
  const issues: ProductionEnvironmentIssue[] = [];
  const requireValue = (variable: string, reason = 'required in production') => {
    if (!present(input[variable])) issues.push({ variable, reason });
  };
  requireValue('NEXT_PUBLIC_SITE_URL');
  requireValue('NEXT_PUBLIC_SUPABASE_URL');
  requireValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  requireValue('SUPABASE_PROJECT_ID');
  requireValue('SUPABASE_SERVICE_ROLE_KEY');
  const smtpHost = present(input.SMTP_HOST) ? input.SMTP_HOST : input.ZOHO_SMTP_HOST;
  const smtpUser = present(input.SMTP_USER) ? input.SMTP_USER : input.ZOHO_SMTP_USER;
  const smtpPassword = present(input.SMTP_PASSWORD)
    ? input.SMTP_PASSWORD
    : input.ZOHO_SMTP_PASSWORD;
  if (!present(smtpHost))
    issues.push({ variable: 'SMTP_HOST/ZOHO_SMTP_HOST', reason: 'required in production' });
  if (!present(smtpUser))
    issues.push({ variable: 'SMTP_USER/ZOHO_SMTP_USER', reason: 'required in production' });
  if (!present(smtpPassword))
    issues.push({ variable: 'SMTP_PASSWORD/ZOHO_SMTP_PASSWORD', reason: 'required in production' });
  requireValue('MAIL_FROM');
  requireValue('TURNSTILE_SECRET_KEY');
  requireValue('NEXT_PUBLIC_TURNSTILE_SITE_KEY');

  if (input.CONTENT_MODE !== 'production')
    issues.push({ variable: 'CONTENT_MODE', reason: 'must be production' });
  if (!truthy(input.TURNSTILE_ENABLED))
    issues.push({ variable: 'TURNSTILE_ENABLED', reason: 'must be true in production' });
  if (truthy(input.META_AUTOMATION_ENABLED) && !truthy(input.META_AUTOMATION_APPROVAL_REQUIRED))
    issues.push({
      variable: 'META_AUTOMATION_APPROVAL_REQUIRED',
      reason: 'must remain true when automation is enabled',
    });
  if (truthy(input.LIVE_EXTERNAL_EXECUTION))
    issues.push({
      variable: 'LIVE_EXTERNAL_EXECUTION',
      reason: 'live social execution is disabled',
    });
  if (truthy(input.TURNSTILE_DISABLED) || truthy(input.DEMO_MODE) || truthy(input.TEST_CREDENTIALS))
    issues.push({ variable: 'production-flags', reason: 'development/test bypass is not allowed' });
  if (localHost(input.NEXT_PUBLIC_SITE_URL))
    issues.push({
      variable: 'NEXT_PUBLIC_SITE_URL',
      reason: 'must not be localhost in production',
    });
  if (localHost(input.NEXT_PUBLIC_SUPABASE_URL))
    issues.push({
      variable: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: 'must not be localhost in production',
    });
  if (localHost(smtpHost) || present(input.MAILPIT_URL))
    issues.push({ variable: 'SMTP_HOST', reason: 'Mailpit/localhost SMTP is not production-safe' });
  if (String(input.SMTP_SECURE ?? '').toLowerCase() !== 'true')
    issues.push({ variable: 'SMTP_SECURE', reason: 'TLS must be enabled in production' });
  for (const variable of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_PASSWORD',
    'TURNSTILE_SECRET_KEY',
    'AUTOMATION_HMAC_SECRET',
    'ZAVLIO_MACHINE_HMAC_SECRET',
  ]) {
    const value = String(input[variable] ?? '').toLowerCase();
    if (value.includes('example') || value.includes('changeme') || value.includes('replace-'))
      issues.push({ variable, reason: 'example/default secret is not allowed' });
  }
  return issues;
}

export function assertProductionEnv(input: Record<string, unknown>): void {
  const issues = productionEnvironmentIssues(input);
  if (issues.length > 0)
    throw new Error(
      'Production environment validation failed: ' +
        issues.map(({ variable, reason }) => variable + ' (' + reason + ')').join(', '),
    );
}
