import crypto from 'node:crypto';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; expiresAt: number }>();

  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt <= now) {
      const expiresAt = now + windowSeconds * 1000;
      this.store.set(key, { count: 1, expiresAt });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetAt: Math.ceil(expiresAt / 1000),
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: Math.ceil(entry.expiresAt / 1000),
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit,
      remaining: limit - entry.count,
      resetAt: Math.ceil(entry.expiresAt / 1000),
    };
  }
}

/**
 * Hash an IP or identifier with a salt for privacy-preserving rate limit keys.
 */
export function hashRateLimitKey(identifier: string, salt = 'zv_salt_default'): string {
  return crypto.createHash('sha256').update(`${salt}:${identifier}`).digest('hex').slice(0, 32);
}

// Global in-memory singleton for single-process/local environments
let globalMemoryLimiter: MemoryRateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!globalMemoryLimiter) {
    globalMemoryLimiter = new MemoryRateLimiter();
  }
  return globalMemoryLimiter;
}
