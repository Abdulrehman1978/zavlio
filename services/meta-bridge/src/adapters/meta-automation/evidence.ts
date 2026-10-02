import type { AdapterJob } from './contracts.js';

export type SafeEvidence = Record<string, string | number | boolean | null>;

const safe = (value: unknown, max = 180): string =>
  String(value ?? '')
    .replaceAll(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max);

export function evidenceFor(job: AdapterJob, fields: Record<string, unknown>): SafeEvidence {
  return {
    adapter: 'meta-automation',
    adapterVersion: '15.0.0',
    upstreamSha: '439c3bfaacb1caabef25a7d67c3f204916a5a168',
    platform: job.channel,
    action: job.actionType,
    targetIdentityMatched: fields.targetIdentityMatched === true,
    origin: safe(fields.origin),
    securityState: safe(fields.securityState),
    planStatus: safe(fields.planStatus),
    verification: safe(fields.verification),
    result: safe(fields.result),
    durationMs: typeof fields.durationMs === 'number' ? fields.durationMs : null,
    contentHash: job.contentHash ?? null,
    contentLength: job.content?.length ?? null,
    bodyTextIncluded: false,
    screenshotUploaded: false,
    cookiesCaptured: false,
  };
}

export function redactLog(value: unknown): string {
  return safe(value, 500)
    .replaceAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]')
    .replaceAll(/\bBearer\s+[^\s,}]+/gi, 'Bearer [REDACTED]')
    .replaceAll(/[A-Za-z0-9_-]{32,}/g, '[REDACTED_TOKEN]')
    .replaceAll(
      /(secret|password|cookie|authorization|api[-_]?key)\s*[:=]\s*[^\s,}]+/gi,
      '$1=[REDACTED]',
    );
}
