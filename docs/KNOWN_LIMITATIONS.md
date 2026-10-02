# Known Limitations

## Packet 17 operational closure

Hosted configuration, provider-specific production secrets, distributed rate
limiting, and authenticated social accounts remain unavailable here. Docker/
Postgres is now available locally, but the Packet 17R database gate remains
NOT VERIFIED because pgTAP, Packet 08–13 regressions, merged-person social
canonicalization, and database-backed E2E checks are failing. Do not deploy
database changes until those gates pass.

## Packet 17R database release gate

The earlier Docker Linux-engine failure was WSL/Service/CreateInstance/
CreateVm/HCS/0x800705aa. After reboot, Docker recovered and Packet 17R
collected local catalog, generated-type, materialization, canary, performance,
and restore evidence. The remaining NOT VERIFIED state is due to actual
regressions, not an environment-only bypass.

- Packet 14 has no Meta credentials, approved upstream Meta Automation revision, browser/CDP session, social discovery/sync, or real external execution. These are intentionally Packet 15+.
- Machine rate limiting is process-local. Production deployment needs an edge/distributed limiter, secret-manager integration, supervisor, alerting, and production load evidence.
- Local HMAC/claim timing and the 3,000-job queue fixture are diagnostic evidence, not production SLOs.
- The local Supabase pgTAP extension emits third-party `plpgsql_check` findings during broad extension lint; the application `public` schema and pgTAP suite pass.

- Packet 01 provides repository/tooling and temporary route foundations only; no production public design or business feature implementation exists.
- The approved Stitch export, brand/media assets, production content, and asset licenses were not supplied.
- No hosted Supabase project, Vercel project, domain configuration, SMTP account, Turnstile keys, or observability project was available; Git is initialized locally with no remote.
- No pinned Meta Automation upstream URL or commit and no browser/social test environment were available.
- Packet 06R repository and database runtime gates pass; hosted deployment and
  provider restore evidence remain pending.
- Legal/privacy/outreach policies and retention durations require qualified approval.
- The managed pnpm launcher intermittently reports embedded Node `24.19.0` while project/test executables and the required pin use Node `24.13.0`; CI resolves `.node-version` exactly.
- ESLint `9.39.5` produces an install-time deprecation notice; its Next.js peer graph is clean and zero-warning lint passes, while ESLint 10 is not yet supported by the selected React lint plugin.
- Hosted Supabase is not configured; Packet 06R verified the local Docker-backed Supabase runtime.
- Supabase-generated types are authoritative for the verified local schema and must be regenerated after future migrations.
- Packet 08 analytics has no dashboard, export/delete workflow, distributed rate limiter, country geolocation, cross-device identity, or CRM/person resolution. These are intentionally out of scope until later approved packets.
- The local Supabase CLI still has the Packet 07 email-login/signup mapping caveat documented in `docs/SECURITY.md`; it is unrelated to the Packet 08 analytics runtime pass.

## Packet 09 limitations

## Packet 10 limitations

This packet does not implement full pipeline/task/conversation workspaces, scoring dashboards, or automation controls. Notes are immutable after creation. Search is bounded page/offset search without fuzzy ranking. Hosted Auth email-login verification remains the Packet 07 external dependency.

- Production SMTP deliverability and hosted Turnstile verification are not proven locally; Mailpit and local Turnstile bypass are verified.
- Rate limiting is process-local until a distributed limiter is selected.
- Conflict candidates have no Packet 09 staff review UI.
- Conversation and automation work remain later packets; reporting is now delivered by Packet 12.

## Packet 11 limitations

- Scoring is explicit/manual or CLI batch; no hosted scheduler or asynchronous scoring queue is active.
- Model activation is a reviewed database operation. The settings page is read-only.
- Version 1 has no negative signals and does not infer arbitrary service affinity from unknown URLs.
- Pipeline movement uses an accessible stage selector; optional drag/drop is not implemented.
- Search remains bounded ILIKE/page-offset. Conversation, analytics-dashboard, automation, and outbound-eligibility controls remain future packets.

## Packet 12 limitations

- Analytics represents consented tracked browsers only; browser IDs are not guaranteed unique humans.
- Actual invoice/payment/recognized revenue, FX conversion, ad spend/ROAS, and causal attribution are not implemented.
- Current scores and pipeline/task states are not reconstructed as historical daily snapshots.
- Reporting performance is local evidence; production volume and plans remain unproven.
- Hosted Supabase Auth email-login verification remains the Packet 07 external dependency.

## Packet 15 limitations

- Upstream is pinned to one unsigned SHA and Packet 15 does not auto-update it.
- Instagram is unsupported; there is no social discovery, canonical upstream identity sync, upstream follow-up scheduler, autonomous next-best-action, or real external social execution.
- Real-site testing is not claimed; authenticated accounts, platform UI stability, platform policy/account risk, and production supervision remain external or later-packet dependencies.
- Local CDP/browser and the synthetic fixture are engineering evidence only. Docker/Supabase reset, migration replay, pgTAP, and generated types could not be rerun on this host because Docker Desktop is unavailable.

## Packet 15R.1 limitations

- `SyntheticTargetProofProvider` is deliberately not a real Threads, Facebook, or LinkedIn provider. Packet 16 must supply reviewed platform-specific proof/control implementations.
- Crash-before/after external browser injection and authenticated read-only real-site evidence remain unavailable; unknown outcomes remain fail-closed and are not automatically replayed.

## Packet 13 limitations

- There is no real external executor, Meta Bridge machine authentication, HMAC protocol, browser/CDP integration, social lead discovery, AI next-best-action, or production scheduler.
- No production channel policy or legal-basis mapping is approved; consent rules remain explicit configuration pending qualified review.
- Production platform rate limits, queue volume, hosted agent liveness, and autonomous mode are not validated. Packet 13 deliberately forces dry run and approval.
- Hosted Supabase Auth email-login verification remains the Packet 07 external dependency.

## Packet 16 limitations

- No Instagram, official API claim, autonomous discovery, mass outreach, login automation, CAPTCHA/MFA bypass, or authenticated real-site evidence.
- Live canary is disabled and was not performed. Local Docker/Postgres replay
  and generated types now have evidence; pgTAP and the signed Packet 14
  database runtime path remain unresolved.
- Provider selectors/heuristics and conversation parsing can drift with platform UI changes; manual review remains required for unknown outcomes.
