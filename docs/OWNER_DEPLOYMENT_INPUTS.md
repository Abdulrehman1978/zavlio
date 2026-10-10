# Owner Deployment Inputs & Infrastructure Manifest

**Workspace**: `C:\zavlio`  
**Target Domain**: `https://zavlio.online`  
**Purpose**: Authoritative inventory of external cloud resources, credentials, business decisions, and legal approvals required from the platform owner before initiating hosted staging/production deployment.

---

## 1. Cloud Hosting & Infrastructure

| Input Parameter         | Priority | Purpose & Requirement                                                   | Validation Method                   | Recommended Secret Storage |
| :---------------------- | :------- | :---------------------------------------------------------------------- | :---------------------------------- | :------------------------- |
| **Hosting Platform**    | P0       | Vercel, AWS ECS, or Fly.io container deployment for Next.js App Router  | Edge build and SSR operational      | Platform Dashboard         |
| **Custom Domain DNS**   | P0       | DNS A/AAAA and CNAME records pointing `zavlio.online` to hosting origin | `dig zavlio.online` / SSL handshake | Cloudflare / DNS Registrar |
| **SSL/TLS Certificate** | P0       | Automated TLS termination via Cloudflare or hosting CDN                 | HTTPS 443 active with TLS 1.3       | CDN Edge                   |

---

## 2. Database & Identity Infrastructure (Supabase)

| Input Parameter                     | Priority | Purpose & Requirement                                      | Validation Method                   | Recommended Secret Storage  |
| :---------------------------------- | :------- | :--------------------------------------------------------- | :---------------------------------- | :-------------------------- |
| **Staging Supabase Project**        | P0       | Dedicated isolated project for pre-production verification | `supabase status` / DB ping         | Staging Env Secrets         |
| **Production Supabase Project**     | P0       | Production project with point-in-time recovery (PITR)      | `supabase db push` test             | Production Env Secrets      |
| **`NEXT_PUBLIC_SUPABASE_URL`**      | P0       | Public API gateway URL for Supabase client                 | HTTPS 200 on `/rest/v1/`            | Public Environment Variable |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | P0       | Public anon key scoped strictly by Postgres RLS            | JWT validation                      | Public Environment Variable |
| **`SUPABASE_SERVICE_ROLE_KEY`**     | P0       | Server-only admin key for auth triggers & outbox worker    | Server-only execution; NEVER client | Encrypted Secret Store      |
| **`SUPABASE_JWT_SECRET`**           | P0       | HMAC secret for verifying Supabase auth session tokens     | Auth token decode                   | Encrypted Secret Store      |

---

## 3. Communication & Bot Protection Integrations

| Input Parameter                      | Priority | Purpose & Requirement                                                  | Validation Method                    | Recommended Secret Storage  |
| :----------------------------------- | :------- | :--------------------------------------------------------------------- | :----------------------------------- | :-------------------------- |
| **Transactional SMTP Host & Port**   | P0       | Authorized email delivery infrastructure (e.g. Zoho, Resend, Postmark) | TLS connection on port 587/465       | Server Secret Store         |
| **`SMTP_USER` & `SMTP_PASSWORD`**    | P0       | Credentials for transactional email outbox worker                      | Test message to allowlisted inbox    | Encrypted Secret Store      |
| **Domain Email SPF/DKIM/DMARC**      | P0       | TXT records authenticating sender domain `zavlio.online`               | DMARC inspector tool                 | DNS Registrar               |
| **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** | P0       | Cloudflare Turnstile public key for form spam protection               | Widget renders on `/start-a-project` | Public Environment Variable |
| **`TURNSTILE_SECRET_KEY`**           | P0       | Server secret for verifying Turnstile bot tokens                       | Server verification returns success  | Encrypted Secret Store      |

---

## 4. Internal Security & Machine Protocol Keys

| Input Parameter                  | Priority | Purpose & Requirement                                              | Validation Method         | Recommended Secret Storage |
| :------------------------------- | :------- | :----------------------------------------------------------------- | :------------------------ | :------------------------- |
| **`ZAVLIO_MACHINE_HMAC_SECRET`** | P0       | 64-char hex key for signing inter-service machine requests         | `crypto.createHmac` match | Encrypted Secret Store     |
| **Central Rate Limiter Storage** | P1       | Redis / Upstash connection string for multi-instance rate limiting | Ping / SET / GET          | Server Secret Store        |

---

## 5. Owner Business & Legal Sign-Offs

| Decision Item                        | Required Reviewer | Status                    | Action Required Prior to Public Launch                                                      |
| :----------------------------------- | :---------------- | :------------------------ | :------------------------------------------------------------------------------------------ |
| **Legal Entity Registration**        | Company Owner     | `OWNER_DECISION_REQUIRED` | Confirm trading entity, registered address, and jurisdiction for Terms/Privacy.             |
| **Privacy Policy & DSR Policy**      | Legal Counsel     | `LEGAL_REVIEW_REQUIRED`   | Formally approve subject access request response timeline and retention policy matrix.      |
| **Terms of Service**                 | Legal Counsel     | `LEGAL_REVIEW_REQUIRED`   | Review limitation of liability and intellectual property clauses.                           |
| **Monitored Contact Inbox**          | Company Owner     | `OWNER_DECISION_REQUIRED` | Confirm `contact@zavlio.online` is active, monitored, and receiving inbound communications. |
| **Production Content Authorization** | Platform Owner    | `OWNER_DECISION_REQUIRED` | Authorize transitioning concept studies to production or supplying client references.       |
| **Social Provider Live Execution**   | Platform Owner    | `INTENTIONALLY_DISABLED`  | Explicitly remains `LIVE_EXTERNAL_EXECUTION=false`. No live outreach permitted.             |
