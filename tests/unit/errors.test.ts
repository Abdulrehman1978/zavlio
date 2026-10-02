import { describe, expect, it } from 'vitest';
import { AppError, toPublicError } from '@zavlio/config';

describe('typed application errors', () => {
  it('exposes safe client errors', () => {
    expect(
      toPublicError(new AppError({ code: 'NOT_FOUND', message: 'Missing.', status: 404 })),
    ).toEqual({ code: 'NOT_FOUND', message: 'Missing.' });
  });
  it('hides internal details', () => {
    expect(toPublicError(new Error('sensitive'))).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    });
  });
});
