import {
  conversationKey,
  normalizePlainText,
  normalizeProfilePath,
  normalizeUsername,
  stableTargetKey,
  type BoundControl,
  type ObservableTarget,
  type ProviderPreparation,
  type SocialAction,
  type SocialElement,
  type SocialObservation,
  type SocialPageSnapshot,
  type SocialPlatform,
  type SocialProvider,
  type SocialTarget,
  type TargetVerification,
  type VerificationResult,
} from './types.js';

const same = (left: string | undefined, right: string | undefined) =>
  left !== undefined && right !== undefined && left === right;

export abstract class SyntheticFixtureSocialProvider implements SocialProvider {
  abstract readonly platform: SocialPlatform;
  abstract readonly version: string;
  abstract readonly origin: string;

  protected abstract profilePathMatches(path: string): boolean;
  protected abstract targetFromPage(page: SocialPageSnapshot): ObservableTarget | null;

  determineAuthState(page: SocialPageSnapshot) {
    if (page.authState) return page.authState;
    if (page.securitySignal || page.platformRestriction) return 'SECURITY_CHALLENGE' as const;
    const path = new URL(page.url).pathname.toLocaleLowerCase('en-US');
    if (path.includes('login')) return 'LOGIN_REQUIRED' as const;
    if (path.includes('checkpoint') || path.includes('challenge'))
      return 'SECURITY_CHALLENGE' as const;
    return 'UNKNOWN' as const;
  }

  observeTarget(page: SocialPageSnapshot): ObservableTarget | null {
    if (!this.isTrustedOrigin(page.url)) return null;
    const target = this.targetFromPage(page);
    if (!target) return null;
    return {
      username: normalizeUsername(target.username),
      stableId: target.stableId?.trim() || undefined,
      profileUrl: target.profileUrl,
      conversationId: target.conversationId?.trim() || undefined,
    };
  }

  verifyTarget(page: SocialPageSnapshot, expected: SocialTarget): TargetVerification {
    if (expected.platform !== this.platform)
      return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Platform mismatch.' };
    let parsed: URL;
    try {
      parsed = new URL(page.url);
    } catch {
      return { ok: false, code: 'INSUFFICIENT_TARGET_EVIDENCE', detail: 'Page URL is invalid.' };
    }
    if (!this.isTrustedOrigin(parsed.toString()))
      return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Origin is not trusted.' };
    const observed = this.observeTarget(page);
    if (!observed)
      return {
        ok: false,
        code: 'INSUFFICIENT_TARGET_EVIDENCE',
        detail: 'Target evidence is absent.',
      };
    if (expected.username && !same(normalizeUsername(expected.username), observed.username))
      return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Username disagrees.' };
    if (expected.stableId && !same(expected.stableId.trim(), observed.stableId))
      return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Stable ID disagrees.' };
    if (expected.profileUrl) {
      let expectedPath: string;
      let observedPath: string;
      try {
        expectedPath = normalizeProfilePath(expected.profileUrl);
        observedPath = observed.profileUrl
          ? normalizeProfilePath(observed.profileUrl)
          : parsed.pathname.replace(/\/+$/, '') || '/';
      } catch {
        return {
          ok: false,
          code: 'INSUFFICIENT_TARGET_EVIDENCE',
          detail: 'Profile URL is invalid.',
        };
      }
      if (!this.profilePathMatches(expectedPath) || expectedPath !== observedPath)
        return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Profile path disagrees.' };
    }
    if (expected.conversationId && !same(expected.conversationId.trim(), observed.conversationId))
      return { ok: false, code: 'TARGET_IDENTITY_MISMATCH', detail: 'Conversation ID disagrees.' };
    return { ok: true, target: observed };
  }

  resolveComposer(page: SocialPageSnapshot, target: SocialTarget): BoundControl {
    return this.resolveControl(page, target, 'COMPOSER');
  }

  resolveActionControl(
    page: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
  ): BoundControl {
    return this.resolveControl(page, target, 'COMMIT_CONTROL', action);
  }

  observePage(page: SocialPageSnapshot): SocialObservation {
    const target = this.observeTarget(page);
    const profile = page.profile
      ? {
          username: target?.username,
          stableId: target?.stableId,
          profileUrl: target?.profileUrl,
          displayName: normalizePlainText(page.profile.displayName ?? '', 240) || undefined,
          headline: normalizePlainText(page.profile.headline ?? '', 500) || undefined,
          bio: normalizePlainText(page.profile.bio ?? '', 1000) || undefined,
          organizationName:
            normalizePlainText(page.profile.organizationName ?? '', 240) || undefined,
        }
      : null;
    const conversation = page.conversation
      ? {
          providerConversationId:
            page.conversation.providerConversationId ||
            conversationKey(this.platform, undefined, page.conversation.participant),
          participant: page.conversation.participant,
          messages: page.conversation.messages.map((message) => ({
            ...message,
            body: normalizePlainText(message.body),
            links: (message.links ?? []).slice(0, 10),
            attachmentMetadata: (message.attachmentMetadata ?? []).slice(0, 10),
          })),
        }
      : null;
    return {
      schemaVersion: 'SOCIAL_OBSERVATION_V1',
      platform: this.platform,
      providerVersion: this.version,
      observedAt: new Date().toISOString(),
      authState: this.determineAuthState(page),
      target,
      profile,
      conversation,
    };
  }

  prepareAction(
    page: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
  ): ProviderPreparation {
    const auth = this.determineAuthState(page);
    if (auth === 'LOGIN_REQUIRED')
      return { ok: false, status: 'MANUAL_ACTION_REQUIRED', code: 'AUTH_REQUIRED', detail: auth };
    if (auth === 'SECURITY_CHALLENGE' || auth === 'UNKNOWN')
      return {
        ok: false,
        status: 'MANUAL_ACTION_REQUIRED',
        code: 'SECURITY_CHECKPOINT',
        detail: auth,
      };
    const proof = this.verifyTarget(page, target);
    if (!proof.ok)
      return { ok: false, status: 'UNVERIFIED', code: proof.code, detail: proof.detail };
    const commitControl = this.resolveActionControl(page, target, action);
    if (!commitControl.ok)
      return {
        ok: false,
        status: 'UNVERIFIED',
        code: commitControl.code,
        detail: commitControl.detail,
      };
    const composer = ['DM', 'REPLY', 'COMMENT', 'PUBLISH'].includes(action)
      ? this.resolveComposer(page, target)
      : undefined;
    if (composer && !composer.ok)
      return { ok: false, status: 'UNVERIFIED', code: composer.code, detail: composer.detail };
    return {
      ok: true,
      status: 'READY_TO_SUBMIT',
      target: proof.target,
      composer: composer as (BoundControl & { ok: true }) | undefined,
      commitControl,
      observation: this.observePage(page),
    };
  }

  verifyActionResult(
    before: SocialPageSnapshot,
    after: SocialPageSnapshot,
    target: SocialTarget,
    action: SocialAction,
    approvedContent?: string,
  ): VerificationResult {
    const proof = this.verifyTarget(after, target);
    if (!proof.ok)
      return { status: 'OUTCOME_UNKNOWN', code: 'OUTCOME_UNKNOWN', detail: proof.detail };
    const verification = after.verification;
    if (!verification)
      return { status: 'OUTCOME_UNKNOWN', code: 'OUTCOME_UNKNOWN', detail: 'No result evidence.' };
    if (verification.targetKey && verification.targetKey !== stableTargetKey(proof.target))
      return {
        status: 'UNVERIFIED',
        code: 'VERIFICATION_FAILED',
        detail: 'Target result disagrees.',
      };
    if (['DM', 'REPLY', 'COMMENT', 'PUBLISH'].includes(action)) {
      const expected = normalizePlainText(approvedContent ?? '');
      if (!verification.content || normalizePlainText(verification.content) !== expected)
        return {
          status: 'UNVERIFIED',
          code: 'VERIFICATION_FAILED',
          detail: 'Content not verified.',
        };
    }
    const verified =
      action === 'FOLLOW'
        ? verification.state === 'FOLLOWING'
        : action === 'CONNECT'
          ? verification.state === 'PENDING' || verification.state === 'SENT'
          : action === 'LIKE'
            ? verification.state === 'LIKED'
            : Boolean(verification.messageIds?.length || verification.state === 'PUBLISHED');
    if (!verified)
      return {
        status: 'UNVERIFIED',
        code: 'VERIFICATION_FAILED',
        detail: 'Provider state not verified.',
      };
    return {
      status: 'VERIFIED_SUCCESS',
      evidence: {
        platform: this.platform,
        providerVersion: this.version,
        verification: verification.state ?? 'message-visible',
        targetKey: stableTargetKey(proof.target),
        beforeUrl: before.url,
        afterUrl: after.url,
      },
    };
  }

  protected isTrustedOrigin(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.origin === this.origin;
    } catch {
      return false;
    }
  }

  protected resolveControl(
    page: SocialPageSnapshot,
    target: SocialTarget,
    kind: SocialElement['kind'],
    action?: SocialAction,
  ): BoundControl {
    const targetKey = stableTargetKey(target);
    const candidates = page.elements.filter(
      (element) =>
        element.kind === kind &&
        element.visible &&
        element.enabled &&
        element.targetKey === targetKey &&
        (action === undefined || element.action === action),
    );
    if (candidates.length !== 1)
      return {
        ok: false,
        code: kind === 'COMPOSER' ? 'COMPOSER_NOT_FOUND' : 'ACTION_CONTROL_NOT_FOUND',
        detail:
          String(candidates.length) +
          ' exact ' +
          kind.toLocaleLowerCase('en-US') +
          ' controls matched.',
      };
    const control = candidates[0];
    if (!control)
      return {
        ok: false,
        code: kind === 'COMPOSER' ? 'COMPOSER_NOT_FOUND' : 'ACTION_CONTROL_NOT_FOUND',
        detail: 'Exact control disappeared during resolution.',
      };
    return { ok: true, control };
  }
}
