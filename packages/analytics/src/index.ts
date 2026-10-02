export const ANALYTICS_POLICY_VERSION = '2026-09-v1' as const;
export const ANALYTICS_VISITOR_TTL_DAYS = 180;
export const ANALYTICS_SESSION_TIMEOUT_MINUTES = 30;
export const ANALYTICS_BATCH_MAX = 20;
export const ANALYTICS_BODY_MAX_BYTES = 64 * 1024;
export const ANALYTICS_METADATA_MAX_BYTES = 4096;
export const ANALYTICS_QUEUE_MAX = 100;

export const EVENT_NAMES = [
  'session_started',
  'page_viewed',
  'service_viewed',
  'project_viewed',
  'lab_project_viewed',
  'insight_viewed',
  'showreel_started',
  'showreel_completed',
  'cta_clicked',
  'start_project_opened',
  'project_form_started',
  'project_form_step_completed',
  'project_form_abandoned',
  'project_form_submitted',
  'contact_form_submitted',
  'login_started',
  'login_completed',
  'outbound_social_click',
  'download_clicked',
  'cookie_preferences_updated',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
export type ConsentState =
  'UNKNOWN' | 'ESSENTIAL_ONLY' | 'ANALYTICS_ALLOWED' | 'ANALYTICS_DENIED' | 'WITHDRAWN';
export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export type EventMetadataMap = {
  session_started: Record<string, never>;
  page_viewed: Record<string, never>;
  service_viewed: { serviceSlug: string };
  project_viewed: { projectSlug: string };
  lab_project_viewed: { projectSlug: string };
  insight_viewed: { insightSlug: string };
  showreel_started: Record<string, never>;
  showreel_completed: Record<string, never>;
  cta_clicked: { ctaId: string; placement?: string; destination?: string };
  start_project_opened: Record<string, never>;
  project_form_started: { formId: string };
  project_form_step_completed: { formId: string; step: number; stepKey?: string };
  project_form_abandoned: { formId: string; step?: number; stepKey?: string };
  project_form_submitted: { formId: string };
  contact_form_submitted: { formId: string };
  login_started: { route?: string };
  login_completed: { outcome: 'success' | 'failure' };
  outbound_social_click: { platform: string; destination: string };
  download_clicked: { assetId: string; assetType?: string; path?: string };
  cookie_preferences_updated: {
    analytics: boolean;
    marketingEmail: boolean;
    marketingSocial: boolean;
    personalization: boolean;
  };
};

export type TrackEvent<Name extends EventName = EventName> = {
  id: string;
  name: Name;
  occurredAt: string;
  pagePath?: string;
  metadata: EventMetadataMap[Name];
};

export type AnalyticsContext = {
  pagePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceCategory?: DeviceCategory;
  country?: string;
};

export class AnalyticsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsValidationError';
  }
}

const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const SENSITIVE_QUERY_KEYS =
  /^(code|token|token_hash|access_token|refresh_token|password|secret|email|phone|state)$/i;

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  throw new AnalyticsValidationError('A secure event identifier is unavailable.');
}

function cleanString(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || CONTROL_CHARS.test(value))
    throw new AnalyticsValidationError('Invalid analytics text.');
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, max) : undefined;
}

export function sanitizePagePath(value: unknown): string | undefined {
  const raw = cleanString(value, 512);
  if (!raw) return undefined;
  if (!raw.startsWith('/') || raw.startsWith('//'))
    throw new AnalyticsValidationError('Only internal page paths are allowed.');
  const path = raw.split(/[?#]/, 1)[0] || '/';
  if (
    path === '/crm' ||
    path.startsWith('/crm/') ||
    path === '/auth' ||
    path.startsWith('/auth/') ||
    path === '/login' ||
    path.startsWith('/api/')
  )
    return undefined;
  return path;
}

export function sanitizeReferrer(value: unknown): string | undefined {
  const raw = cleanString(value, 2048);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return `${url.origin}${url.pathname}`.slice(0, 512);
  } catch {
    return undefined;
  }
}

export function sanitizeUtm(value: unknown, max = 120): string | undefined {
  return cleanString(value, max)?.toLowerCase();
}

export function normalizeSource(utmSource: unknown, referrer: unknown): string {
  const utm = sanitizeUtm(utmSource, 80);
  if (utm) return normalizeHost(utm);
  const safeReferrer = sanitizeReferrer(referrer);
  if (!safeReferrer) return 'direct';
  return normalizeHost(new URL(safeReferrer).hostname);
}

function normalizeHost(value: string): string {
  const host = value.toLowerCase().replace(/^www\./, '');
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
  if (host === 'l.instagram.com') return 'instagram';
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'lnkd.in')
    return 'linkedin';
  if (host === 'google.com' || host.endsWith('.google.com') || host.startsWith('google.'))
    return 'google';
  if (host === 'bing.com' || host.endsWith('.bing.com') || host.startsWith('bing.')) return 'bing';
  return host.slice(0, 80) || 'unknown';
}

export function getDeviceCategory(userAgent: string | undefined): DeviceCategory {
  const ua = userAgent?.toLowerCase() ?? '';
  if (!ua) return 'unknown';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|windows phone/.test(ua)) return 'mobile';
  return 'desktop';
}

export function sanitizeContext(input: unknown): AnalyticsContext {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const record = input as Record<string, unknown>;
  const device = record.deviceCategory;
  return {
    pagePath: sanitizePagePath(record.pagePath),
    referrer: sanitizeReferrer(record.referrer),
    utmSource: sanitizeUtm(record.utmSource),
    utmMedium: sanitizeUtm(record.utmMedium),
    utmCampaign: sanitizeUtm(record.utmCampaign),
    utmTerm: sanitizeUtm(record.utmTerm),
    utmContent: sanitizeUtm(record.utmContent),
    deviceCategory:
      device === 'desktop' || device === 'mobile' || device === 'tablet' || device === 'unknown'
        ? device
        : undefined,
    country: cleanString(record.country, 2)?.toUpperCase(),
  };
}

const METADATA_KEYS: Record<EventName, readonly string[]> = {
  session_started: [],
  page_viewed: [],
  service_viewed: ['serviceSlug'],
  project_viewed: ['projectSlug'],
  lab_project_viewed: ['projectSlug'],
  insight_viewed: ['insightSlug'],
  showreel_started: [],
  showreel_completed: [],
  cta_clicked: ['ctaId', 'placement', 'destination'],
  start_project_opened: [],
  project_form_started: ['formId'],
  project_form_step_completed: ['formId', 'step', 'stepKey'],
  project_form_abandoned: ['formId', 'step', 'stepKey'],
  project_form_submitted: ['formId'],
  contact_form_submitted: ['formId'],
  login_started: ['route'],
  login_completed: ['outcome'],
  outbound_social_click: ['platform', 'destination'],
  download_clicked: ['assetId', 'assetType', 'path'],
  cookie_preferences_updated: ['analytics', 'marketingEmail', 'marketingSocial', 'personalization'],
};

export function sanitizeMetadata<Name extends EventName>(
  name: Name,
  input: unknown,
): EventMetadataMap[Name] {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new AnalyticsValidationError('Analytics metadata must be an object.');
  const record = input as Record<string, unknown>;
  const allowed = METADATA_KEYS[name];
  for (const key of Object.keys(record))
    if (!allowed.includes(key))
      throw new AnalyticsValidationError('Unsupported analytics metadata.');
  const output: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = record[key];
    if (value === undefined) continue;
    if (key === 'step') {
      if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 20)
        throw new AnalyticsValidationError('Invalid analytics step.');
      output[key] = Number(value);
    } else if (
      ['analytics', 'marketingEmail', 'marketingSocial', 'personalization'].includes(key)
    ) {
      if (typeof value !== 'boolean')
        throw new AnalyticsValidationError('Invalid analytics preference.');
      output[key] = value;
    } else if (name === 'login_completed' && key === 'outcome') {
      if (value !== 'success' && value !== 'failure')
        throw new AnalyticsValidationError('Invalid login outcome.');
      output[key] = value;
    } else {
      const safe = cleanString(value, 160);
      if (!safe) throw new AnalyticsValidationError('Invalid analytics metadata value.');
      output[key] = safe;
    }
  }
  if (new TextEncoder().encode(JSON.stringify(output)).byteLength > ANALYTICS_METADATA_MAX_BYTES)
    throw new AnalyticsValidationError('Analytics metadata is too large.');
  return output as EventMetadataMap[Name];
}

export function validateEvent(input: unknown): TrackEvent {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new AnalyticsValidationError('Invalid analytics event.');
  const value = input as Record<string, unknown>;
  if (!isUuid(value.id)) throw new AnalyticsValidationError('Invalid analytics event identifier.');
  if (typeof value.name !== 'string' || !EVENT_NAME_SET.has(value.name))
    throw new AnalyticsValidationError('Unsupported analytics event.');
  if (typeof value.occurredAt !== 'string' || Number.isNaN(Date.parse(value.occurredAt)))
    throw new AnalyticsValidationError('Invalid analytics timestamp.');
  return {
    id: value.id,
    name: value.name as EventName,
    occurredAt: new Date(value.occurredAt).toISOString(),
    pagePath: sanitizePagePath(value.pagePath),
    metadata: sanitizeMetadata(value.name as EventName, value.metadata ?? {}),
  } as TrackEvent;
}

export function isSensitiveQueryKey(key: string): boolean {
  return SENSITIVE_QUERY_KEYS.test(key);
}

type Listener = () => void;
export type AnalyticsClient = {
  getConsent(): ConsentState;
  getVisitorId(): string | undefined;
  getSessionId(): string | undefined;
  setConsent(
    state: Extract<ConsentState, 'ANALYTICS_ALLOWED' | 'ANALYTICS_DENIED' | 'WITHDRAWN'>,
  ): Promise<boolean>;
  track<Name extends EventName>(
    name: Name,
    metadata: EventMetadataMap[Name],
    pagePath?: string,
  ): boolean;
  page(pagePath?: string): boolean;
  flush(): Promise<void>;
  subscribe(listener: Listener): () => void;
  destroy(): void;
};

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document !== 'undefined')
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
function deleteCookie(name: string): void {
  if (typeof document !== 'undefined')
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}
function consentFromCookie(): ConsentState {
  const state = readCookie('zv_consent')?.split('|')[0];
  if (state === 'analytics_allowed') return 'ANALYTICS_ALLOWED';
  if (state === 'analytics_denied') return 'ANALYTICS_DENIED';
  if (
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return 'ANALYTICS_DENIED';
  return 'UNKNOWN';
}

export function createAnalyticsClient(
  options: {
    endpoint?: string;
    enabled?: boolean;
    debug?: boolean;
    batchMax?: number;
    queueMax?: number;
  } = {},
): AnalyticsClient {
  const endpoint = options.endpoint ?? '/api/analytics/events';
  const enabled = options.enabled ?? true;
  const batchMax = options.batchMax ?? ANALYTICS_BATCH_MAX;
  const queueMax = options.queueMax ?? ANALYTICS_QUEUE_MAX;
  let consent = consentFromCookie();
  let queue: TrackEvent[] = [];
  let inFlight = false;
  let retryCount = 0;
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((listener) => listener());
  const isAllowed = () => enabled && consent === 'ANALYTICS_ALLOWED';
  const log = (message: string) => {
    if (options.debug) console.debug(`[analytics] ${message}`);
  };
  const flush = async (): Promise<void> => {
    if (!queue.length || inFlight || !isAllowed() || typeof fetch === 'undefined') return;
    inFlight = true;
    const batch = queue.splice(0, batchMax);
    try {
      const currentUrl = typeof location !== 'undefined' ? new URL(location.href) : undefined;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: batch,
          context: {
            pagePath: currentUrl?.pathname,
            referrer: typeof document !== 'undefined' ? document.referrer : undefined,
            utmSource: currentUrl?.searchParams.get('utm_source') ?? undefined,
            utmMedium: currentUrl?.searchParams.get('utm_medium') ?? undefined,
            utmCampaign: currentUrl?.searchParams.get('utm_campaign') ?? undefined,
            utmTerm: currentUrl?.searchParams.get('utm_term') ?? undefined,
            utmContent: currentUrl?.searchParams.get('utm_content') ?? undefined,
            deviceCategory: getDeviceCategory(
              typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            ),
          },
        }),
      });
      if (!response.ok && response.status >= 500 && retryCount < 2) {
        retryCount += 1;
        queue = [...batch, ...queue].slice(-queueMax);
      } else if (!response.ok && response.status < 500)
        log(`dropped analytics batch (${response.status})`);
      else retryCount = 0;
    } catch {
      if (retryCount < 2) {
        retryCount += 1;
        queue = [...batch, ...queue].slice(-queueMax);
      }
    } finally {
      inFlight = false;
      if (queue.length && retryCount && typeof window !== 'undefined')
        window.setTimeout(() => void flush(), 250 * 2 ** retryCount);
    }
  };
  const track = <Name extends EventName>(
    name: Name,
    metadata: EventMetadataMap[Name],
    pagePath?: string,
  ): boolean => {
    if (!isAllowed()) return false;
    try {
      const event = validateEvent({
        id: createEventId(),
        name,
        occurredAt: new Date().toISOString(),
        pagePath: pagePath ?? (typeof location !== 'undefined' ? location.pathname : undefined),
        metadata,
      });
      queue.push(event);
      if (queue.length > queueMax) queue = queue.slice(-queueMax);
      if (queue.length >= batchMax) void flush();
      return true;
    } catch {
      return false;
    }
  };
  const page = (pagePath?: string) => {
    if (!isAllowed()) return false;
    if (!readCookie('zv_sid')) track('session_started', {}, pagePath);
    const tracked = track('page_viewed', {}, pagePath);
    void flush();
    return tracked;
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && queue.length) {
      const body = JSON.stringify({ events: queue.splice(0, batchMax) });
      if (!navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' })))
        void flush();
    }
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
  return {
    getConsent: () => consent,
    getVisitorId: () => readCookie('zv_vid'),
    getSessionId: () => readCookie('zv_sid'),
    async setConsent(state) {
      if (!enabled) return false;
      try {
        const response = await fetch('/api/analytics/consent', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            state,
            source: state === 'WITHDRAWN' ? 'withdrawal' : 'cookie_ui',
          }),
        });
        if (!response.ok) return false;
        consent = state === 'WITHDRAWN' ? 'WITHDRAWN' : state;
        if (state === 'ANALYTICS_ALLOWED' && !readCookie('zv_vid'))
          writeCookie('zv_vid', createEventId(), ANALYTICS_VISITOR_TTL_DAYS * 86400);
        if (state !== 'ANALYTICS_ALLOWED') {
          queue = [];
          deleteCookie('zv_vid');
          deleteCookie('zv_sid');
        }
        notify();
        return true;
      } catch {
        return false;
      }
    },
    track,
    page,
    flush,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisibility);
      listeners.clear();
      queue = [];
    },
  };
}
