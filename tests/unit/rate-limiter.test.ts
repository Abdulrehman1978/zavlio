import { describe, expect, it } from 'vitest';
import { getRateLimiter, hashRateLimitKey } from '../../apps/web/src/lib/rate-limiter';

describe('Abuse Protection & Rate Limiter', () => {
  it('hashes identifiers with salt deterministically and with privacy', () => {
    const key1 = hashRateLimitKey('192.168.1.100', 'test_salt');
    const key2 = hashRateLimitKey('192.168.1.100', 'test_salt');
    const key3 = hashRateLimitKey('192.168.1.101', 'test_salt');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1.length).toBe(32);
    // Does not reveal IP directly
    expect(key1).not.toContain('192.168.1.100');
  });

  it('allows requests within the configured limit and blocks when exceeded', async () => {
    const limiter = getRateLimiter();
    const uniqueKey = `test_key_${Date.now()}`;

    // First request
    const res1 = await limiter.check(uniqueKey, 3, 10);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    // Second request
    const res2 = await limiter.check(uniqueKey, 3, 10);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    // Third request
    const res3 = await limiter.check(uniqueKey, 3, 10);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // Fourth request (exceeded)
    const res4 = await limiter.check(uniqueKey, 3, 10);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetAt).toBeGreaterThan(0);
  });
});
