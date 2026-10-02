# Release checklist

Use this checklist for every release candidate and record evidence in the corresponding work result.

- [ ] Immutable source/release identifier recorded; no automatic commit.
- [ ] Frozen install, format, lint, typecheck, unit, build, audit, and secret scan pass.
- [ ] Packet pin/source hashes pass; pinned upstream remains unmodified.
- [ ] Disposable database reset, migration replay, db lint/tests, generated types twice, and type hash comparison pass.
- [ ] RLS matrix and Packet 16 ingestion/canary/concurrency checks pass.
- [ ] Production environment validator rejects unsafe defaults; no demo, Mailpit, test credentials, or live social execution.
- [ ] Hosted Auth, SMTP, Turnstile, observability, backup, restore, and selected deployment target have evidence or are marked external.
- [ ] Security headers, cookie/CSRF review, PII bounds, rate-limit plan, and redaction tests pass.
- [ ] Post-deploy smoke plan and rollback/forward-fix decision are reviewed.
- [ ] Bridge supervision, kill switch, HMAC rotation, replay protection, and dry-run state are verified.
- [ ] No real social side effect is attempted as part of generic CI or this packet.

## Packet 17R verification note

Docker recovery, clean 20-migration replay, db lint, runtime catalog/RLS
inspection, deterministic generated types, Packet 16 dedupe/identity/canary
fixtures, performance harnesses, and a disposable restore rehearsal now have
evidence in docs/work/17R-result.md. The release checklist remains unchecked
because pgTAP, Packet 08–13 regressions, merged-person social
canonicalization, and four database-backed E2E tests failed. DATABASE RELEASE
GATE = NOT VERIFIED; do not deploy database changes or start Packet 18.
