import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  canonicalMachineRequest,
  claimRequestSchema,
  handshakeRequestSchema,
  intersectCapabilities,
  isTimestampAccepted,
  resultRequestSchema,
} from '@zavlio/automation/protocol';

const vector = {
  method: 'POST',
  pathname: '/api/internal/automation/v1/heartbeat',
  agentKey: 'test-agent',
  keyId: 'test-key-1',
  timestamp: '1790691000',
  nonce: 'b6ab6f8d-2cc5-4b9f-b7b3-2ca7c6046f67',
  body: '{"operationId":"e403177a-3e9e-49f0-954a-74c5db10923b"}',
  secret: 'packet-14-fake-test-secret-32bytes!',
};
describe('machine protocol v1', () => {
  it('pins the documented canonical request, body hash, and signature vector', () => {
    const bodySha256 = createHash('sha256').update(vector.body).digest('hex');
    const canonical = canonicalMachineRequest({ ...vector, bodySha256 });
    expect(bodySha256).toBe('21a98f89825466ad06729c811896b2dda8ca9606a6c8b641f865e33eb064b1a1');
    expect(canonical).toBe(
      `v1\nPOST\n/api/internal/automation/v1/heartbeat\ntest-agent\ntest-key-1\n1790691000\nb6ab6f8d-2cc5-4b9f-b7b3-2ca7c6046f67\n21a98f89825466ad06729c811896b2dda8ca9606a6c8b641f865e33eb064b1a1`,
    );
    expect(createHmac('sha256', vector.secret).update(canonical).digest('base64url')).toBe(
      'zoXW-Mp1Z5ruQR2pgzTKjD1wLwdzkIlGzXjffyXkVM8',
    );
  });
  it('uses constant-time byte comparison semantics', () => {
    const a = Buffer.alloc(32, 1),
      b = Buffer.alloc(32, 1),
      c = Buffer.alloc(32, 2);
    expect(timingSafeEqual(a, b)).toBe(true);
    expect(timingSafeEqual(a, c)).toBe(false);
  });
  it('accepts inclusive 300 second skew and rejects outside it', () => {
    const now = 1_790_691_000_000;
    expect(isTimestampAccepted(1_790_690_700, now)).toBe(true);
    expect(isTimestampAccepted(1_790_691_300, now)).toBe(true);
    expect(isTimestampAccepted(1_790_690_699, now)).toBe(false);
    expect(isTimestampAccepted(1_790_691_301, now)).toBe(false);
  });
  it('intersects capabilities without self-escalation', () => {
    expect(
      intersectCapabilities(
        { channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] },
        {
          channels: ['INTERNAL', 'INSTAGRAM'],
          actions: ['NOOP', 'DM'],
          executionModes: ['DRY_RUN_ONLY'],
        },
      ),
    ).toEqual({ channels: ['INTERNAL'], actions: ['NOOP'], executionModes: ['DRY_RUN_ONLY'] });
  });
  it('validates operation IDs and bounded typed envelopes', () => {
    expect(
      claimRequestSchema.safeParse({
        operationId: crypto.randomUUID(),
        instanceId: crypto.randomUUID(),
        maxJobs: 1,
      }).success,
    ).toBe(true);
    expect(handshakeRequestSchema.safeParse({}).success).toBe(false);
    expect(resultRequestSchema.safeParse({}).success).toBe(false);
  });
});
