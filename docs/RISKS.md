# Risk Register & Mitigation Strategy

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Status**: Authoritative (Pre-Deployment Complete)

---

## 1. Historical Resolution Note

In the initial Packet 17 execution, the risk register identified failing pgTAP tests and Docker service unavailability as critical active blockers. These historical risks were formally resolved in baseline CI run `38038752615` (where clean 20-migration replay, zero schema errors, 175/175 pgTAP assertions, and 27/27 Playwright E2E tests passed).

---

## 2. Active Risk Register (Current at HEAD)

| Risk ID   | Description                                                                                                                | Likelihood |  Impact  |  Severity  | Mitigation & Verification Gate                                                                                                                                 |
| :-------- | :------------------------------------------------------------------------------------------------------------------------- | :--------: | :------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-101** | **Hosted Deployment Configuration Drift**: Differences between local environment and production Vercel/Cloudflare runtime. |   Medium   |   High   | **Medium** | Pre-deployment environment schema in `packages/validation`; fail-fast startup checks; offline rehearsal script (`scripts/offline-rehearsal.mjs`).              |
| **R-102** | **Multi-Instance Rate Limiting**: In-memory rate limiter does not share state across multiple cloud serverless instances.  |   Medium   |  Medium  | **Medium** | Abstracted rate limiter contract; Redis adapter specification documented in `docs/OWNER_DEPLOYMENT_INPUTS.md` for production provisioning.                     |
| **R-103** | **Third-Party Email Deliverability (SMTP)**: Transactional emails fail SPF/DKIM/DMARC checks on custom domain.             |   Medium   |   High   |  **High**  | Outbox pattern decouples email delivery from lead capture; retry backoff capped at 5; DNS records documented in `docs/OWNER_DEPLOYMENT_INPUTS.md`.             |
| **R-104** | **Unreviewed Legal or Retention Policies**: Executing destructive deletion jobs without formal compliance review.          |    Low     | Critical |  **High**  | Destructive deletion is blocked by policy; UI provides `DRY_RUN_PREVIEW_ONLY`; status held in `PENDING_POLICY_APPROVAL` until owner counsel sign-off.          |
| **R-105** | **Live Social Automation Compliance**: External platforms restricting accounts due to automated interactions.              |    Low     | Critical |  **High**  | `LIVE_EXTERNAL_EXECUTION=false` strictly enforced; Instagram unsupported; semantic adapter runs dry-run only; no automated CAPTCHA bypass.                     |
| **R-106** | **HMAC Key Compromise**: Exposure of machine signing secrets allowing unauthorized bridge access.                          |    Low     | Critical |  **High**  | Bridge receives no database credentials; keys stored only in server environment; 24-hour nonce ledger prevents replay attacks; constant-time MAC verification. |

---

## 3. Residual Technical Risk Assessment

1. **Database Schema & Migrations**: Minimal risk. 20 forward-only migrations have been tested across multiple clean replays, with zero type drift between database types and application models.
2. **Client-Side Security**: Minimal risk. Strict Content Security Policy (report-only), HTTP Strict Transport Security, zero client-side service-role keys, and automatic recursive log redaction.
3. **Accessibility & Usability**: Minimal risk. 0 axe-core violations across 27 public routes and 15 CRM workspaces; full keyboard navigability and WCAG 2.2 AA contrast compliance verified.
