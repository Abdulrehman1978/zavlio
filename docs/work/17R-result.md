# Zavlio Packet 17R result

## Scope and decision

Packet 17R was verification-only. No product feature, migration, UI redesign,
Packet 18 work, automatic commit, or live social action was performed. The
source remains an uncommitted review artifact and RELEASE_SOURCE_NOT_COMMITTED
is still the release identifier.

DATABASE RELEASE GATE = NOT VERIFIED. The gate is not promoted because the
repository pgTAP suite and several Packet 08–14 runtime regressions still fail,
and the merged-person social-ingestion invariant is not satisfied. The local
backup/restore rehearsal itself completed successfully, but it cannot override
those failures.

## Host and Docker evidence

- WSL 2.7.3.0, kernel 6.6.114.1-1; Ubuntu-24.04 boots as WSL2 and the root
  probe returned WSL_OK.
- Docker Desktop 4.91.0 / Engine 29.8.0, context desktop-linux, server
  healthy; docker run --rm hello-world passed.
- pnpm db:start passed. pnpm db:reset then passed after reboot; no
  reservation workaround or repository configuration change was made.
- The earlier WSL/HCS 0x800705aa and excluded-port blocker are retained as
  historical recovery evidence only.

## Clean migration replay and catalog

pnpm db:reset applied all 20 migrations in filename order through
20261001062000_social_ingestion_materialization.sql. pnpm db:lint passed
with “No schema errors found”.

Runtime PostgreSQL catalog counts after reset:

| Catalog item                                                                         |                Count |
| ------------------------------------------------------------------------------------ | -------------------: |
| Public tables / partitioned tables                                                   |                   52 |
| Public views/materialized views                                                      |                    6 |
| Public functions in public                                                           |                  105 |
| Public indexes                                                                       |                  156 |
| Public RLS-enabled tables                                                            |                   52 |
| Public policies                                                                      |                   96 |
| information_schema role_table_grants: anon / authenticated / postgres / service_role | 42 / 132 / 406 / 406 |

The Packet 07 Auth/RLS runtime matrix passed for owner, admin, operator,
viewer, nonstaff, and inactive users; public signup was denied and Mailpit was
reachable.

## pgTAP and generated types

pnpm db:test is FAIL. Nine SQL test files were discovered and 157 tests
were declared. The failure is in
meta_automation_adapter_test.sql: pg_get_functiondef was called with the
text literal public.claim_next_automation_job(uuid,integer) instead of an
OID/regprocedure, so execution stopped after 10 tests with a plan mismatch
(planned 16, ran 10). No test or migration was changed under this
verification-only packet.

pnpm db:types passed twice. Both generated
packages/db/src/generated/database.types.ts and produced the identical
SHA-256:

7F8E2E624618E685C074A1267F0B225683C81BE3ABC0FFEF0607A9A0A31655F9

The generator emitted its existing formatting warning; type drift was not
observed.

## Packet 16 database evidence

- Repeated record_social_observation with the same operation/hash produced
  one provider observation, one identity observation, one conversation, and one
  message. The controlled fixture emitted
  PACKET16_MATERIALIZATION_PASS.
- Unknown identity remained OBSERVED with person_id = NULL.
- Admin review promoted a fixture to CONFIRMED, linked the person, and created
  the verified identity (PACKET16_CONFIRMED_IDENTITY_PASS).
- An ambiguous identity candidate remained PENDING
  (PACKET17R_CANDIDATE_AMBIGUITY_PASS); no automatic merge occurred.
- Two concurrent consumers of a one-use Threads/LIKE canary returned one
  true and one false; used_count = 1 and consumed_at was set.
  Replay, wrong platform, expired, revoked, wrong action, and wrong target all
  returned false.
- The merged-person social-ingestion fixture FAILED:
  MERGED_SOCIAL_IDENTITY_NOT_REPOINTED. merge_people repointed normal CRM
  relations, but the existing social_identity_observations.person_id stayed
  on the archived source, so future materialization cannot be claimed
  canonical. This is a release-blocking product defect and was not patched in
  Packet 17R.

## Packet 08–14 and adapter/provider regressions

| Area                            | Result                                                |
| ------------------------------- | ----------------------------------------------------- |
| Packet 07 auth/RLS runtime      | PASS                                                  |
| Packet 08 analytics runtime     | FAIL — unknown consent was not ignored                |
| Packet 09 lead intake runtime   | FAIL — expected confirmation/internal outbox jobs     |
| Packet 09 SMTP failure runtime  | PASS — transaction committed and outbox marked FAILED |
| Packet 10 CRM runtime           | PASS                                                  |
| Packet 11 operations runtime    | PASS                                                  |
| Packet 12 reporting runtime     | FAIL — score model/coverage mismatch                  |
| Packet 13 automation runtime    | FAIL — job was claimed more than once                 |
| Packet 14 signed Bridge runtime | NOT RUN — Bridge endpoint 127.0.0.1:3014 timed out    |
| Packet 15R.1 adapter            | PASS                                                  |
| Packet 16 provider              | PASS — 31 checks, zero real external side effects     |

Packet 15R.1 exact-binding, target-proof, cancellation/STOP/timeout,
one-shot, dialog-latch, integrity, prompt/origin, secret-isolation, and pin
checks passed. No upstream source or live provider was modified.

## Performance

The three local database performance harnesses passed:

- automation: 3,000-row fixture; approval/jobs/candidate reads 4.96–8.46 ms;
- operations: 1,000 people, 1,000 opportunities, 2,000 tasks, 100-person
  scoring batch; all checks passed;
- reporting: 1,000 visitors, 2,000 sessions, 10,000 events, 250 people,
  200 enquiries, 150 opportunities, 500 tasks; all report checks and plans
  passed.

These are representative local timings, not production SLO claims.

## Backup and restore rehearsal

A PostgreSQL custom-format dump was created locally (1,300,026 bytes;
SHA-256 7F2FDE1A8D88574C5342927F079F2DB60DE2C950282AEDAA740EA35C96E749C8).
A plain-SQL public-schema export was restored into a disposable database after
creating only local pgcrypto, citext, and minimal auth stubs needed to model
the provider boundary. The restore completed with ON_ERROR_STOP=1, zero SQL
errors, and catalog counts of 52 tables, 141 public functions, and 52 RLS
tables. Representative restored rows were present:

people=1023 identities=2 conversations=1 messages=1 automation_jobs=3013
audit_logs=28 social_observations=2 social_identities=2

The temporary database was dropped after verification. This is local
engineering evidence, not provider PITR or hosted restore evidence.

## E2E, accessibility, and responsive checks

The database-backed Playwright/axe run used the local Zavlio server on port
3100 because an unrelated container owns port 3000. It ran 18 tests; four
failed (analytics consent callback, contact-form status, automation approval
transition, and operator stage transition) and the remaining tests did not
produce a full green suite. No accessibility or responsive production claim
is made from this run.

## Other gates and external dependencies

Current format, lint, strict typecheck, 89 unit tests, Meta Bridge build,
workspace build, audit, secret scan, redaction, and pnpm meta:verify-pin gates
passed; no pinned
source drift or uncontrolled upstream .env was introduced. Hosted Auth, SMTP,
Turnstile, observability, deployment target, authenticated read-only social
accounts, and the Antigravity-dependent broad upstream suite remain external.
Real external social side effects remain exactly zero.

## Required follow-up

Fix and test merged-person social observation canonicalization, repair the
pgTAP function-definition assertion, and resolve the failing Packet 08–13 and
database-backed E2E regressions. Rerun the complete release gate, including
the signed Packet 14 path, before considering a release commit. Packet 18 was
not started.

## Final status

NOT_VERIFIED — INTERNAL REGRESSIONS, with DATABASE RELEASE GATE = NOT
VERIFIED. External hosted dependencies also remain. Do not deploy database
changes, do not commit automatically, and do not start Packet 18.
