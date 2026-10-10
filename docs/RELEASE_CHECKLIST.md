# Release Checklist & Pre-Deployment Verification

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Status**: Authoritative (Pre-Deployment Takeover Complete)

---

## 1. Verified Engineering Release Gates

All items below have passed automated verification in the local environment and baseline CI:

- [x] **Repository Hygiene**: Clean Git status, frozen lockfile (`pnpm install --frozen-lockfile`), Node `24.13.0`, pnpm `11.19.0`.
- [x] **Static Analysis**: TypeScript strict typecheck passing across all 10 monorepo packages (`pnpm typecheck`).
- [x] **Code Quality**: ESLint passing with zero warnings under `--max-warnings 0` (`pnpm lint`).
- [x] **Code Formatting**: 100% Prettier compliant (`pnpm format:check`).
- [x] **Unit Testing**: 110/110 unit tests passing (`pnpm test:unit`).
- [x] **Production Compilation**: Next.js production build compiling cleanly with 53 static routes (`pnpm build`).
- [x] **Security Scanning**: Secret scan passing with 0 credentials or private keys detected (`pnpm security:scan`).
- [x] **Log Redaction**: Structured-log redaction verified across 6 test cases (`pnpm test:security:redaction`).
- [x] **Meta Automation Pin**: Pinned upstream integrity verified against commit `439c3bfaac...` and tree `e4f412b...` (`pnpm meta:verify-pin`).
- [x] **Meta Adapter Invariants**: 44/44 semantic dry-run checks passing (`node scripts/meta-adapter-runtime-test.mjs`).
- [x] **Social Provider Invariants**: 31/31 checks passing; Instagram unsupported, zero live side effects (`node scripts/social-provider-runtime-test.mjs`).
- [x] **SEO Crawl Verification**: 27/27 public routes crawled and verified 100% PASS with canonical URLs (`node scripts/seo-crawl-audit.mjs`).
- [x] **Offline Staging Rehearsal**: 11/11 stages verified in automated rehearsal (`node scripts/offline-rehearsal.mjs`).
- [x] **Accessibility Auditing**: 0 axe-core violations across 27 public routes and 15 CRM workspaces.
- [x] **Database Migrations**: 20 forward-only migrations verified in clean replay without schema drift.
- [x] **Safe Outbox Worker**: Linear backoff algorithm and retry cap (5 attempts) verified (`tests/unit/outbox-worker.test.ts`).
- [x] **Sliding-Window Limiter**: Rate limiter adapter with deterministic salting verified (`tests/unit/rate-limiter.test.ts`).
- [x] **Truth in Content**: All studio cases and lab projects truthfully labeled; zero fake testimonials.

---

## 2. Hosted & Deployment Release Gates (Awaiting Staging/Production Rollout)

The items below represent external operations to be executed during the hosted deployment phase:

- [ ] **Hosting Provisioning**: Link repository to Vercel or Cloudflare Pages; configure build commands.
- [ ] **Hosted Database**: Provision staging and production Supabase projects; apply migrations via Supabase CLI.
- [ ] **Domain & SSL**: Configure DNS records for `zavlio.online` and establish Cloudflare SSL/TLS proxy.
- [ ] **Production Secrets**: Populate environment variables in hosting provider (refer to `docs/OWNER_DEPLOYMENT_INPUTS.md`).
- [ ] **Transactional SMTP**: Configure Zoho ZeptoMail or SendGrid; verify SPF, DKIM, and DMARC DNS records.
- [ ] **Cloudflare Turnstile**: Generate production Turnstile keys; replace local dev bypass keys.
- [ ] **Distributed Redis**: Provision Upstash Redis for distributed multi-instance rate limiting.
- [ ] **Hosted Staging Walkthrough**: Perform end-to-end smoke test on hosted staging URL with staff test accounts.
- [ ] **Legal Counsel Sign-Off**: Formally approve Terms of Service, Privacy Policy, and Data Retention schedule.
