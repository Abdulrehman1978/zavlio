export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_DEPENDENCY_ERROR';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(options: { code: AppErrorCode; message: string; status: number; expose?: boolean }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status;
    this.expose = options.expose ?? options.status < 500;
  }
}

export function toPublicError(error: unknown): { code: AppErrorCode; message: string } {
  if (error instanceof AppError && error.expose)
    return { code: error.code, message: error.message };
  return { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };
}
