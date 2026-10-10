# Known Limitations

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Status**: Authoritative (Pre-Deployment Complete)

---

## 1. Current State at HEAD (Pre-Deployment Takeover)

All feasible non-deployment engineering, testing, and documentation are complete. The remaining limitations represent genuine external dependencies, provider configurations, and legal reviews that must occur in the hosted environment:

1. **Hosted Cloud Infrastructure Not Provisioned**:
   - Vercel / Cloudflare Pages hosting is not yet linked or deployed.
   - Hosted Supabase project is not yet provisioned; schema migrations have been validated via local clean replay and GitHub CI run `38038752615`.
   - Domain `zavlio.online` DNS records and SSL/TLS edge certificates are awaiting owner configuration.
2. **External Provider Accounts & Credentials Required**:
   - Production transactional SMTP (Zoho ZeptoMail or SendGrid) is not active; local testing relies on Mailpit and mock outbox verification.
   - Production Cloudflare Turnstile keys are not configured; local verification uses test credentials.
   - Real social accounts (Threads, Facebook, LinkedIn) are not authenticated; `LIVE_EXTERNAL_EXECUTION=false` is enforced.
3. **Instagram Integration Intentionally Unsupported**:
   - Instagram automation is strictly excluded by design due to platform API restrictions and account security risks.
4. **Rate Limiting Scope**:
   - Abuse protection on public forms and machine APIs uses an in-memory sliding window limiter (`apps/web/src/lib/rate-limiter.ts`), which is bounded on a single instance. Multi-replica production deployment requires provisioning a distributed Redis store (e.g. Upstash).
5. **Policy Approvals & Legal Sign-Off**:
   - Terms of Service, Privacy Policy, and Data Retention periods are technically enforced via dry-run interfaces and require formal legal counsel review before destructive retention jobs are enabled.

---

## 2. Historical Packet 17 Initial Run vs. Baseline Resolution (Historical Record)

### Initial Run State (Packet 17 Initial Execution, 2026-10-01)

During the initial Packet 17 verification run, the local Windows Docker Desktop daemon encountered a WSL engine error (`0x800705aa`), preventing local execution of the pgTAP test harness and database-backed Playwright checks. Consequently, the database release gate was initially recorded as `NOT VERIFIED`.

### Baseline CI Resolution (Commit `6ab81b9` / CI Run `38038752615`)

Following Docker service recovery and the subsequent green CI execution on GitHub Actions:

- **Database Job**: Executed clean PostgreSQL container startup, clean 20-migration replay, zero schema lint errors, zero type drift, and passed all 175 pgTAP test assertions (`175/175 passed`).
- **Verify Job**: Passed all unit tests (89/89), Meta pin checks (7/7), and all 27 Playwright E2E/axe suites.
- **Outcome**: The database release gate was officially promoted to `VERIFIED`.

---

## 3. Component & Module-Specific Constraints

### Analytics & Telemetry (Packet 08)

- Telemetry reflects consented browsers only; GPC signals are strictly honored as opt-outs.
- Visitor IDs (`zv_vid`) represent browser instances, not verified human identities.
- First touch attribution remains immutable; latest touch updates only on new attributed sessions.

### CRM & Data Operations (Packets 10–12)

- Person search uses indexed, bounded ILIKE queries; fuzzy vector search is intentionally deferred.
- Notes are append-only and immutable after creation.
- Revenue metrics in executive reports reflect contracted pipeline opportunities, not settled bank deposits or ERP ledger balances.

### Machine Automation Bridge (Packets 13–16)

- The Meta Bridge runs strictly in dry-run mode (`DRY_RUN_ONLY = true`).
- Max concurrency is strictly limited to 1 execution per agent instance.
- Ambiguous browser dialogs and security checkpoints trigger `MANUAL_ACTION_REQUIRED`; automatic bypass is prohibited.
