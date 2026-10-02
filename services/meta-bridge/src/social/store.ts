import { randomUUID } from 'node:crypto';
import {
  conversationKey,
  messageKey,
  normalizePlainText,
  stableTargetKey,
  type SocialAction,
  type SocialDirection,
  type SocialObservation,
  type SocialPlatform,
  type SocialReadinessState,
} from './types.js';

export type SocialIdentityVerification = 'OBSERVED' | 'CANDIDATE' | 'CONFIRMED';

export type SocialIdentityRecord = {
  id: string;
  platform: SocialPlatform;
  providerKey: string;
  username?: string;
  stableId?: string;
  profileUrl?: string;
  personId?: string;
  canonicalPersonId?: string;
  verification: SocialIdentityVerification;
  confidence: number;
  source: 'OBSERVED' | 'CRM_LINK' | 'STAFF_REVIEW';
  firstSeenAt: string;
  lastSeenAt: string;
};

export type IdentityMatchCandidate = {
  id: string;
  identity: SocialIdentityRecord;
  candidatePersonIds: string[];
  reasonCodes: string[];
  confidenceEvidence: Record<string, string | number | boolean>;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
};

export type SocialConversationRecord = {
  id: string;
  platform: SocialPlatform;
  providerConversationId: string;
  conversationKey: string;
  identityId: string;
  personId?: string;
  lastMessageAt: string | null;
};

export type SocialMessageRecord = {
  id: string;
  conversationId: string;
  providerMessageKey: string;
  providerMessageId?: string;
  direction: SocialDirection;
  body: string;
  senderIdentityId: string;
  personId?: string;
  providerTimestamp: string | null;
  receivedAt: string;
  edited: boolean;
  deleted: boolean;
};

export type SocialTouchpoint = {
  id: string;
  personId?: string;
  platform: SocialPlatform;
  direction: SocialDirection;
  type: 'INBOUND_MESSAGE' | 'OUTBOUND_MESSAGE' | SocialAction;
  conversationId?: string;
  messageId?: string;
  occurredAt: string;
};

export type OutboundRecord = {
  operationId: string;
  platform: SocialPlatform;
  action: SocialAction;
  personId?: string;
  status: 'VERIFIED_SUCCESS';
  providerReference?: string;
};

export type IngestResult = {
  identity: SocialIdentityRecord;
  candidate: IdentityMatchCandidate | null;
  conversation: SocialConversationRecord | null;
  insertedMessageIds: string[];
  duplicateMessageCount: number;
  insertedTouchpointIds: string[];
};

export class SocialObservationStore {
  private readonly identities = new Map<string, SocialIdentityRecord>();
  private readonly candidates = new Map<string, IdentityMatchCandidate>();
  private readonly conversations = new Map<string, SocialConversationRecord>();
  private readonly messages = new Map<string, SocialMessageRecord>();
  private readonly touchpoints = new Map<string, SocialTouchpoint>();
  private readonly outbound = new Map<string, OutboundRecord>();
  private readonly canonicalPerson = new Map<string, string>();
  private readonly readiness = new Map<SocialPlatform, SocialReadinessState>();

  constructor() {
    for (const platform of ['THREADS', 'FACEBOOK', 'LINKEDIN'] as const)
      this.readiness.set(platform, 'PROVIDER_IMPLEMENTED');
  }

  setReadiness(platform: SocialPlatform, state: SocialReadinessState): void {
    this.readiness.set(platform, state);
  }

  getReadiness(platform: SocialPlatform): SocialReadinessState {
    return this.readiness.get(platform) ?? 'UNIMPLEMENTED';
  }

  linkMergedPerson(sourcePersonId: string, canonicalPersonId: string): void {
    this.canonicalPerson.set(sourcePersonId, canonicalPersonId);
  }

  confirmIdentity(providerKey: string, personId: string): SocialIdentityRecord | null {
    const identity = this.identities.get(providerKey);
    if (!identity) return null;
    identity.personId = personId;
    identity.canonicalPersonId = this.resolveCanonicalPerson(personId);
    identity.verification = 'CONFIRMED';
    identity.confidence = 1;
    identity.source = 'STAFF_REVIEW';
    return identity;
  }

  rejectCandidate(candidateId: string): void {
    const candidate = this.candidates.get(candidateId);
    if (candidate) candidate.status = 'REJECTED';
  }

  ingest(observation: SocialObservation, candidatePersonIds: string[] = []): IngestResult {
    const now = new Date().toISOString();
    const target = observation.target ?? observation.conversation?.participant ?? {};
    const providerKey = observation.platform + ':' + stableTargetKey(target);
    let identity = this.identities.get(providerKey);
    if (!identity) {
      identity = {
        id: randomUUID(),
        platform: observation.platform,
        providerKey,
        username: target.username,
        stableId: target.stableId,
        profileUrl: target.profileUrl,
        verification: 'OBSERVED',
        confidence: 0,
        source: 'OBSERVED',
        firstSeenAt: now,
        lastSeenAt: now,
      };
      this.identities.set(providerKey, identity);
    } else {
      identity.lastSeenAt = now;
    }
    const canonical = identity.personId
      ? this.resolveCanonicalPerson(identity.personId)
      : undefined;
    if (canonical) identity.canonicalPersonId = canonical;
    const candidate =
      !identity.personId && candidatePersonIds.length > 0
        ? this.upsertCandidate(identity, candidatePersonIds, now)
        : null;
    let conversation: SocialConversationRecord | null = null;
    const insertedMessageIds: string[] = [];
    const insertedTouchpointIds: string[] = [];
    let duplicateMessageCount = 0;
    if (observation.conversation) {
      const cKey = conversationKey(
        observation.platform,
        observation.conversation.providerConversationId,
        observation.conversation.participant,
      );
      conversation = this.conversations.get(cKey) ?? {
        id: randomUUID(),
        platform: observation.platform,
        providerConversationId: observation.conversation.providerConversationId,
        conversationKey: cKey,
        identityId: identity.id,
        personId: canonical,
        lastMessageAt: null,
      };
      this.conversations.set(cKey, conversation);
      for (const message of observation.conversation.messages.slice(0, 100)) {
        const mKey = messageKey(observation.platform, cKey, message);
        const existing = this.messages.get(mKey);
        if (existing) {
          duplicateMessageCount += 1;
          continue;
        }
        const id = randomUUID();
        const receivedAt = now;
        const record: SocialMessageRecord = {
          id,
          conversationId: conversation.id,
          providerMessageKey: mKey,
          providerMessageId: message.providerMessageId,
          direction: message.direction,
          body: message.deleted ? '[message removed]' : normalizePlainText(message.body),
          senderIdentityId: identity.id,
          personId: canonical,
          providerTimestamp: message.providerTimestamp ?? null,
          receivedAt,
          edited: message.edited ?? false,
          deleted: message.deleted ?? false,
        };
        this.messages.set(mKey, record);
        insertedMessageIds.push(id);
        conversation.lastMessageAt = message.providerTimestamp ?? receivedAt;
        const touchpointKey = cKey + ':' + mKey;
        if (!this.touchpoints.has(touchpointKey)) {
          const touchpoint: SocialTouchpoint = {
            id: randomUUID(),
            personId: canonical,
            platform: observation.platform,
            direction: message.direction,
            type: message.direction === 'INBOUND' ? 'INBOUND_MESSAGE' : 'OUTBOUND_MESSAGE',
            conversationId: conversation.id,
            messageId: id,
            occurredAt: message.providerTimestamp ?? receivedAt,
          };
          this.touchpoints.set(touchpointKey, touchpoint);
          insertedTouchpointIds.push(touchpoint.id);
        }
      }
    }
    return {
      identity,
      candidate,
      conversation,
      insertedMessageIds,
      duplicateMessageCount,
      insertedTouchpointIds,
    };
  }

  recordVerifiedOutbound(input: {
    operationId: string;
    platform: SocialPlatform;
    action: SocialAction;
    personId?: string;
    providerReference?: string;
  }): OutboundRecord {
    const existing = this.outbound.get(input.operationId);
    if (existing) return existing;
    const result: OutboundRecord = { ...input, status: 'VERIFIED_SUCCESS' };
    this.outbound.set(input.operationId, result);
    return result;
  }

  recordDryRunOutbound(): null {
    return null;
  }

  get counts() {
    return {
      identities: this.identities.size,
      candidates: this.candidates.size,
      conversations: this.conversations.size,
      messages: this.messages.size,
      touchpoints: this.touchpoints.size,
      outbound: this.outbound.size,
    };
  }

  private upsertCandidate(
    identity: SocialIdentityRecord,
    candidatePersonIds: string[],
    now: string,
  ): IdentityMatchCandidate {
    const key = identity.id + ':' + candidatePersonIds.slice().sort().join(',');
    const existing = this.candidates.get(key);
    if (existing) return existing;
    const candidate: IdentityMatchCandidate = {
      id: randomUUID(),
      identity,
      candidatePersonIds: [...new Set(candidatePersonIds)].slice(0, 10),
      reasonCodes: ['AMBIGUOUS_SOCIAL_IDENTITY'],
      confidenceEvidence: { source: 'provider-observation' },
      status: 'PENDING',
      createdAt: now,
    };
    this.candidates.set(key, candidate);
    return candidate;
  }

  private resolveCanonicalPerson(personId: string): string {
    let current = personId;
    const seen = new Set<string>();
    while (this.canonicalPerson.has(current) && !seen.has(current)) {
      seen.add(current);
      current = this.canonicalPerson.get(current) as string;
    }
    return current;
  }
}

export type CanaryPermit = {
  id: string;
  platform: SocialPlatform;
  targetKey: string;
  action: SocialAction;
  expiresAt: number;
  maxUses: 1;
  usedCount: number;
  revoked: boolean;
};

export class OneUseCanaryPermitStore {
  private readonly permits = new Map<string, CanaryPermit>();

  issue(
    input: Omit<CanaryPermit, 'id' | 'usedCount' | 'revoked' | 'maxUses'> & { id?: string },
  ): CanaryPermit {
    const permit: CanaryPermit = {
      id: input.id ?? randomUUID(),
      platform: input.platform,
      targetKey: input.targetKey,
      action: input.action,
      expiresAt: input.expiresAt,
      maxUses: 1,
      usedCount: 0,
      revoked: false,
    };
    this.permits.set(permit.id, permit);
    return permit;
  }

  revoke(id: string): void {
    const permit = this.permits.get(id);
    if (permit) permit.revoked = true;
  }

  consume(id: string, platform: SocialPlatform, targetKey: string, action: SocialAction): boolean {
    const permit = this.permits.get(id);
    if (
      !permit ||
      permit.revoked ||
      permit.usedCount >= permit.maxUses ||
      permit.expiresAt <= Date.now() ||
      permit.platform !== platform ||
      permit.targetKey !== targetKey ||
      permit.action !== action
    )
      return false;
    permit.usedCount += 1;
    return true;
  }
}
