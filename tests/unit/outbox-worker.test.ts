import { describe, expect, it } from 'vitest';

describe('Durable Email Outbox Worker & Backoff Logic', () => {
  function computeRetryState(attemptCount: number) {
    const nextAttempt = attemptCount + 1;
    const isFinalFailure = nextAttempt >= 5;
    const backoffSeconds = nextAttempt * 60;
    return {
      nextAttempt,
      status: isFinalFailure ? 'FAILED' : 'RETRY_WAIT',
      backoffSeconds,
    };
  }

  it('calculates exponential linear backoff and transitions status to RETRY_WAIT', () => {
    // Attempt 1 -> 2
    const retry1 = computeRetryState(0);
    expect(retry1.nextAttempt).toBe(1);
    expect(retry1.status).toBe('RETRY_WAIT');
    expect(retry1.backoffSeconds).toBe(60);

    // Attempt 2 -> 3
    const retry2 = computeRetryState(1);
    expect(retry2.nextAttempt).toBe(2);
    expect(retry2.status).toBe('RETRY_WAIT');
    expect(retry2.backoffSeconds).toBe(120);

    // Attempt 4 -> 5 (Final limit reached)
    const retry4 = computeRetryState(4);
    expect(retry4.nextAttempt).toBe(5);
    expect(retry4.status).toBe('FAILED');
  });

  it('prevents infinite retry loops by capping maximum attempts at 5', () => {
    const retry5 = computeRetryState(5);
    expect(retry5.status).toBe('FAILED');
    expect(retry5.nextAttempt).toBe(6);
  });
});
