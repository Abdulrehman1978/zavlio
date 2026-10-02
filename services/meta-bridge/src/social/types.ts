import { createHash } from 'node:crypto';
import { z } from 'zod';

export const SOCIAL_PLATFORMS = ['THREADS', 'FACEBOOK', 'LINKEDIN'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PROVIDER_VERSIONS = {
  THREADS: 'THREADS_PROVIDER_V1',
  FACEBOOK: 'FACEBOOK_PROVIDER_V1',
  LINKEDIN: 'LINKEDIN_PROVIDER_V1',
} as const satisfies Record<SocialPlatform, string>;

export const SOCIAL_READINESS_STATES = [
  'UNIMPLEMENTED',
  'PROVIDER_IMPLEMENTED',
  'READ_ONLY_VERIFIED',
  'AUTH_REQUIRED',
  'SECURITY_BLOCKED',
  'CANARY_READY',
  'LIVE_CANARY_ENABLED',
  'DEGRADED',
  'DISABLED',
] as const;
export type SocialReadinessState = (typeof SOCIAL_READINESS_STATES)[number];

export const socialAuthStateSchema = z.enum([
  'AUTHENTICATED',
  'LOGIN_REQUIRED',
  'SECURITY_CHALLENGE',
  'UNKNOWN',
]);
export type SocialAuthState = z.infer<typeof socialAuthStateSchema>;

export const socialDirectionSchema = z.enum(['INBOUND', 'OUTBOUND']);
export type SocialDirection = z.infer<typeof socialDirectionSchema>;

export const socialActionSchema = z.enum([
  'DM',
  'REPLY',
  'COMMENT',
  'LIKE',
  'FOLLOW',
  'CONNECT',
  'PUBLISH',
]);
export type SocialAction = z.infer<typeof socialActionSchema>;

export const socialFailureCodeSchema = z.enum([
  'PROVIDER_NOT_READY',
  'AUTH_REQUIRED',
  'SECURITY_CHECKPOINT',
  'TARGET_IDENTITY_MISMATCH',
  'INSUFFICIENT_TARGET_EVIDENCE',
  'COMPOSER_NOT_FOUND',
  'ACTION_CONTROL_NOT_FOUND',
  'DOM_CHANGED',
  'PLATFORM_RESTRICTED',
  'RATE_LIMITED',
  'VERIFICATION_FAILED',
  'OUTCOME_UNKNOWN',
  'UNSUPPORTED_PLATFORM',
  'UNSUPPORTED_ACTION',
]);
export type SocialFailureCode = z.infer<typeof socialFailureCodeSchema>;

export const socialTargetSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    username: z.string().trim().min(1).max(200).optional(),
    stableId: z.string().trim().min(1).max(256).optional(),
    profileUrl: z.url().max(2048).optional(),
    conversationId: z.string().trim().min(1).max(512).optional(),
  })
  .strict()
  .refine(
    (target) =>
      Boolean(target.username || target.stableId || target.profileUrl || target.conversationId),
    { message: 'A social target requires at least one strong identifier.' },
  );
export type SocialTarget = z.infer<typeof socialTargetSchema>;

export type SocialElement = {
  elementId: string;
  semanticId: string;
  kind: 'COMPOSER' | 'COMMIT_CONTROL';
  targetKey: string;
  action?: SocialAction;
  role: string;
  accessibleName: string;
  visible: boolean;
  enabled: boolean;
};

export type ObservableTarget = {
  username?: string;
  stableId?: string;
  profileUrl?: string;
  conversationId?: string;
};

export type SocialMessageObservation = {
  providerMessageId?: string;
  sender: ObservableTarget;
  direction: SocialDirection;
  body: string;
  providerTimestamp?: string;
  edited?: boolean;
  deleted?: boolean;
  links?: string[];
  attachmentMetadata?: Array<{ name?: string; mimeType?: string; sizeBytes?: number }>;
};

export type SocialPageSnapshot = {
  url: string;
  title?: string;
  authState?: SocialAuthState;
  securitySignal?: boolean;
  platformRestriction?: boolean;
  target?: ObservableTarget;
  profile?: {
    displayName?: string;
    headline?: string;
    bio?: string;
    organizationName?: string;
  };
  conversation?: {
    providerConversationId?: string;
    participant: ObservableTarget;
    messages: SocialMessageObservation[];
  };
  elements: SocialElement[];
  verification?: {
    state?: string;
    messageIds?: string[];
    content?: string;
    targetKey?: string;
  };
  bodyText?: string;
};

export type SocialObservation = {
  schemaVersion: 'SOCIAL_OBSERVATION_V1';
  platform: SocialPlatform;
  providerVersion: string;
  observedAt: string;
  authState: SocialAuthState;
  target: ObservableTarget | null;
  profile: {
    username?: string;
    stableId?: string;
    profileUrl?: string;
    displayName?: string;
    headline?: string;
    bio?: string;
    organizationName?: string;
  } | null;
  conversation: {
    providerConversationId: string;
    participant: ObservableTarget;
    messages: SocialMessageObservation[];
  } | null;
};

export type TargetVerification =
  | { ok: true; target: ObservableTarget }
  | {
      ok: false;
      code: 'INSUFFICIENT_TARGET_EVIDENCE' | 'TARGET_IDENTITY_MISMATCH';
      detail: string;
    };

export type BoundControl =
  | { ok: true; control: SocialElement }
  | {
      ok: false;
      code: 'COMPOSER_NOT_FOUND' | 'ACTION_CONTROL_NOT_FOUND' | 'DOM_CHANGED';
      detail: string;
    };

export type ProviderPreparation =
  | {
      ok: true;
      status: 'READY_TO_SUBMIT';
      target: ObservableTarget;
      composer?: BoundControl & { ok: true };
      commitControl?: BoundControl & { ok: true };
      observation: SocialObservation;
    }
  | {
      ok: false;
      status: 'MANUAL_ACTION_REQUIRED' | 'UNVERIFIED';
      code: SocialFailureCode;
      detail: string;
    };

export type VerificationResult =
  | { status: 'VERIFIED_SUCCESS'; evidence: Record<string, string | number | boolean | null> }
  | { status: 'UNVERIFIED'; code: 'VERIFICATION_FAILED'; detail: string }
  | { status: 'OUTCOME_UNKNOWN'; code: 'OUTCOME_UNKNOWN'; detail: string };

export type SocialProvider = {
  readonly platform: SocialPlatform;
  readonly version: string;
  readonly origin: string;
  determineAuthState(page: SocialPageSnapshot): SocialAuthState;
  observeTarget(page: SocialPageSnapshot): ObservableTarget | null;
  verifyTarget(page: SocialPageSnapshot, expected: SocialTarget): TargetVerification;
  resolveComposer(page: SocialPageSnapshot, target: SocialTarget): BoundControl;
  resolveActionControl(
    page: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
  ): BoundControl;
  observePage(page: SocialPageSnapshot): SocialObservation;
  prepareAction(
    page: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
  ): ProviderPreparation;
  verifyActionResult(
    before: SocialPageSnapshot,
    after: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
    approvedContent?: string,
  ): VerificationResult;
};

export function normalizeUsername(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^@/, '').toLocaleLowerCase('en-US');
  return normalized || undefined;
}

export function normalizeProfilePath(value: string): string {
  const url = new URL(value);
  return url.pathname.replace(/\/+$/, '') || '/';
}

export function normalizePlainText(value: string, maxLength = 4000): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function stableTargetKey(target: ObservableTarget | SocialTarget): string {
  if (target.stableId) return 'stable:' + target.stableId;
  if (target.profileUrl) return 'profile:' + normalizeProfilePath(target.profileUrl);
  if (target.conversationId) return 'conversation:' + target.conversationId;
  if (target.username) return 'username:' + normalizeUsername(target.username);
  return 'unknown';
}

export function conversationKey(
  platform: SocialPlatform,
  conversationId: string | undefined,
  participant: ObservableTarget,
): string {
  const raw = conversationId?.trim() || stableTargetKey(participant);
  return (platform + ':' + raw).slice(0, 512);
}

export function messageKey(
  platform: SocialPlatform,
  conversation: string,
  message: SocialMessageObservation,
): string {
  const providerId = message.providerMessageId?.trim();
  if (providerId) return (platform + ':' + conversation + ':provider:' + providerId).slice(0, 768);
  const timestamp = message.providerTimestamp ?? 'unknown-time';
  const bodyHash = createHash('sha256')
    .update(normalizePlainText(message.body, 4000), 'utf8')
    .digest('hex');
  return (
    platform +
    ':' +
    conversation +
    ':' +
    stableTargetKey(message.sender) +
    ':' +
    timestamp +
    ':' +
    bodyHash
  );
}
