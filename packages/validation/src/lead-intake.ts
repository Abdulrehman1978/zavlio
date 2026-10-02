import { z } from 'zod';

export const SERVICE_KEYS = [
  'strategy',
  'brand',
  'website',
  'digital_product',
  'ai_automation',
  'growth',
  'content_campaign',
  'unspecified',
] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  strategy: 'Strategy',
  brand: 'Brand',
  website: 'Website',
  digital_product: 'Digital Product',
  ai_automation: 'AI / Automation',
  growth: 'Growth',
  content_campaign: 'Content / Campaign',
  unspecified: 'Not sure yet',
};

export const BUDGET_KEYS = [
  'EXPLORING',
  'INR_1_3_LAKH',
  'INR_3_7_LAKH',
  'INR_7_15_LAKH',
  'INR_15_PLUS',
  'DISCUSS',
] as const;
export type BudgetKey = (typeof BUDGET_KEYS)[number];

export const TIMING_KEYS = [
  'ASAP',
  'ONE_TO_TWO_MONTHS',
  'THREE_TO_SIX_MONTHS',
  'EXPLORING',
] as const;
export type TimingKey = (typeof TIMING_KEYS)[number];

export const SOURCE_KEYS = [
  'INSTAGRAM',
  'LINKEDIN',
  'GOOGLE',
  'REFERRAL',
  'FRIEND_COLLEAGUE',
  'EVENT',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const;
export type SourceKey = (typeof SOURCE_KEYS)[number];

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const common = {
  idempotencyKey: z.uuid(),
  formVersion: z.enum(['START_PROJECT_V1', 'CONTACT_V1']),
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  company: optionalText(200),
  website: optionalText(500).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Website must be a valid http(s) URL'),
  role: optionalText(160),
  honeypot: z.string().max(200).optional().default(''),
  turnstileToken: optionalText(2048),
};

export const startProjectPayloadSchema = z.object({
  ...common,
  formVersion: z.literal('START_PROJECT_V1'),
  services: z.array(z.enum(SERVICE_KEYS)).min(1).max(SERVICE_KEYS.length),
  goal: z.string().trim().min(10).max(5000),
  budget: z.enum(BUDGET_KEYS),
  timing: z.enum(TIMING_KEYS),
  source: z.enum(SOURCE_KEYS),
});

export const contactPayloadSchema = z.object({
  ...common,
  formVersion: z.literal('CONTACT_V1'),
  message: z.string().trim().min(3).max(5000),
});

export type StartProjectPayload = z.infer<typeof startProjectPayloadSchema>;
export type ContactPayload = z.infer<typeof contactPayloadSchema>;

export function normalizeWebsiteDomain(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    const normalized = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
]);

export function isFreeEmailDomain(email: string): boolean {
  return FREE_EMAIL_DOMAINS.has(email.split('@')[1]?.toLowerCase() ?? '');
}

export function deriveDisplayName(name: string): {
  displayName: string;
  firstName?: string;
  lastName?: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    displayName: name.trim(),
    firstName: parts.length > 1 ? parts[0] : undefined,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  };
}
