# Zavlio

Zavlio is an editorial digital experience, privacy-first customer intelligence, and policy-governed automation platform engineered as a strict TypeScript monorepo.

**Current State**: Final Pre-Deployment Engineering Complete (Packets 00–20 Pre-Handoff)  
**Authoritative Specification**: `MASTER_SPEC.md` Version 2.0  
**Repository**: `https://github.com/Abdulrehman1978/zavlio.git`

---

## 1. System Highlights

- **Editorial Public Experience**: 27 statically generated public routes (SSG) styled in bespoke warm ivory tones (`#FBF9F4` base, `#171614` text, `#9E5D2A` accent). Features a kinetic spatial canvas, an interactive 7-stage Operating Cycle, 20+ responsive SVG schematics, and zero draft leakage via `content-resolver.ts`.
- **Comprehensive CRM Control Plane**: Complete staff workspace under `/crm` covering People, Organizations, Canonical Identity Merge, Pipeline Management, Tasks, Conversations, Content Management (`/crm/content`), Campaigns (`/crm/campaigns`), Consent & DSR (`/crm/consent`), Audit Explorer (`/crm/audit`), and Settings (`/crm/settings`).
- **PostgreSQL & Supabase Data Architecture**: 20 forward-only migrations across 39 application tables with deny-by-default Row-Level Security (RLS) and four-tier staff RBAC (VIEWER, OPERATOR, ADMIN, OWNER).
- **Isolated Machine Automation Bridge**: Supervised Node/TypeScript bridge (`services/meta-bridge`) with signed HMAC-SHA256 protocol, deterministic target proof, and pinned upstream (`external/meta-automation` at tree `e4f412b...`). Live social execution is strictly disabled (`LIVE_EXTERNAL_EXECUTION=false`); Instagram is unsupported.
- **Durable Background Operations**: Asynchronous email outbox worker with exponential backoff (max 5 retries), batch lead scoring recalculator with lease checks, and sliding-window rate limiting.

---

## 2. Requirements & Toolchain

- **Node.js**: `24.13.0` (pinned in `.node-version` and `package.json`)
- **pnpm**: `11.19.0` (pinned by `packageManager`)
- **Next.js**: `16.3.8` (App Router)
- **React**: `19.3.0`
- **TypeScript**: `6.0.3` (strict type checking across all 10 packages)
- **Supabase CLI**: `2.118.0` with PostgreSQL 17 target

---

## 3. Quick Start & Local Setup

```powershell
# 1. Clone repository and install frozen dependencies
git clone https://github.com/Abdulrehman1978/zavlio.git
cd zavlio
pnpm install --frozen-lockfile

# 2. Configure environment
Copy-Item .env.example .env.local

# 3. Build config package and start local dev server
pnpm dev
```

Visit `http://localhost:3000` to explore the public experience.

---

## 4. Key Verification & Operational Commands

```powershell
# Code Quality & Tests
pnpm lint                       # ESLint 9 with 0 warnings allowed
pnpm typecheck                  # Strict TypeScript check across 10 packages
pnpm test:unit                  # Run all 110 unit tests (vitest)
pnpm build                      # Compile production web app (53 static routes)
pnpm format:check               # Prettier format check
pnpm security:scan              # Scan 580+ files for secrets and keys
pnpm test:security:redaction    # Test structured-log redaction

# Automated Crawl & Rehearsal Suites
node scripts/seo-crawl-audit.mjs    # Audit all 27 public routes for SEO & canonicals
node scripts/offline-rehearsal.mjs  # Run 11-stage offline deployment rehearsal

# Integration & Adapter Runtimes
pnpm meta:verify-pin            # Verify pinned upstream SHA & tree hashes
pnpm test:integration:meta-adapter    # Run 44 Meta adapter invariant checks
pnpm test:integration:social-provider # Run 31 social provider invariant checks

# Database Commands (Requires local Docker)
pnpm db:start                   # Start local Supabase container
pnpm db:reset                   # Clean replay of 20 migrations + seed defaults
pnpm db:lint                    # Supabase database linter
pnpm db:test                    # Run 175 pgTAP database assertions
pnpm db:types                   # Regenerate typed TypeScript contracts
```

---

## 5. Deployment Prerequisites & Operator Guides

All feasible non-deployment engineering is complete. For staging and production cloud rollout:

1. **Owner Deployment Inputs**: Read [`docs/OWNER_DEPLOYMENT_INPUTS.md`](docs/OWNER_DEPLOYMENT_INPUTS.md) for exact secrets, DNS, SMTP, and Turnstile requirements.
2. **Content Management**: Read [`docs/OPERATOR_GUIDE_CONTENT.md`](docs/OPERATOR_GUIDE_CONTENT.md).
3. **Campaign Management**: Read [`docs/OPERATOR_GUIDE_CAMPAIGNS.md`](docs/OPERATOR_GUIDE_CAMPAIGNS.md).
4. **Consent & Privacy (DSR)**: Read [`docs/OPERATOR_GUIDE_CONSENT.md`](docs/OPERATOR_GUIDE_CONSENT.md).
5. **Audit Explorer**: Read [`docs/OPERATOR_GUIDE_AUDIT.md`](docs/OPERATOR_GUIDE_AUDIT.md).
6. **Pre-Handoff Status**: Read [`docs/work/20-prehandoff-result.md`](docs/work/20-prehandoff-result.md).
