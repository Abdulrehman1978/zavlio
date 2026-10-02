# Observability

Status: bounded implementation with provider-neutral deployment instructions.

Structured events include timestamp, level, component, event/message, requestId where available, jobId/personId only when operationally necessary, durationMs, and stable errorCode. Logger redaction removes authorization values, cookies, passwords, tokens, JWTs, HMAC/signatures, SMTP/Turnstile secrets, and social session material. It does not log full message bodies, emails, forms, DOM, screenshots, or raw social conversations.

Alert categories are HTTP/server errors, form-intake failures, email outbox failures, database/RPC failures, automation queue/lease failures, Bridge connectivity and machine-auth failures, MANUAL_ACTION_REQUIRED/unknown outcomes, provider health, and slow analytics queries. A future Sentry or equivalent provider is optional behind a server-only DSN; correctness never depends on a vendor.

Health is liveness-only and safe; readiness separately reports critical configuration and keeps database/Bridge checks explicit. A degraded social account does not take the core website offline. Log access, retention, sampling, and export must be configured by the selected deployment provider without copying secrets or raw PII.
