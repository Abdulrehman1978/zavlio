export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Readonly<Record<string, boolean | number | string | null | undefined>>;

export interface Logger {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

const SECRET_KEY =
  /(authorization|cookie|password|token|secret|signature|service.?role|hmac|turnstile|smtp|session)/i;
const SECRET_VALUE =
  /(bearer\s+[a-z0-9._~+/=-]+|eyj[a-z0-9._-]+|sb_secret_[a-z0-9_-]+|sk_(?:live|test)_[a-z0-9_-]+|-----begin [^-]+ key-----)/i;

export function redactLogValue(value: unknown, key?: string): unknown {
  if (key && SECRET_KEY.test(key)) return '[REDACTED]';
  if (typeof value === 'string') return SECRET_VALUE.test(value) ? '[REDACTED]' : value;
  if (Array.isArray(value)) return value.map((item) => redactLogValue(item));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redactLogValue(entryValue, entryKey),
      ]),
    );
  return value;
}

export function redactLogContext(context: LogContext): LogContext {
  return redactLogValue(context) as LogContext;
}

export function createLogger(component: string): Logger {
  return {
    log(level, message, context = {}) {
      const serialized = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        component,
        message,
        ...redactLogContext(context),
      });
      if (level === 'error') console.error(serialized);
      else if (level === 'warn') console.warn(serialized);
      else console.log(serialized);
    },
  };
}
