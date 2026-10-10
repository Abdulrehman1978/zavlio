# Operator Guide: Consent & Subject Rights (`/crm/consent`)

**Workspace**: `C:\zavlio`  
**Audience**: Privacy Officers, Legal Administrators, CRM Staff  
**Route**: `/crm/consent`

---

## 1. Overview & Capabilities

The `/crm/consent` workspace centralizes all privacy, consent ledger, and Data Subject Rights (DSR) workflows:

- **Append-Only Consent Ledger**: Review complete history of consent granted, withdrawn, or updated.
- **Global DNC (Do Not Contact)**: Manage individual suppression flags.
- **Personal Data Export**: Generate bounded, secure JSON exports for subject access requests.
- **Anonymization & Erasure**: Execute policy-compliant erasure dry-runs with safety holds.

---

## 2. Permissions & Roles (RBAC)

| Action                          | VIEWER  |  OPERATOR   |    ADMIN    |          OWNER           |
| :------------------------------ | :-----: | :---------: | :---------: | :----------------------: |
| View consent records & timeline | Allowed |   Allowed   |   Allowed   |         Allowed          |
| Toggle Global DNC status        | Denied  | **Allowed** | **Allowed** |       **Allowed**        |
| Export Subject Data (DSR)       | Denied  |   Denied    | **Allowed** |       **Allowed**        |
| Generate Anonymize Dry-Run      | Denied  |   Denied    | **Allowed** |       **Allowed**        |
| Execute Destructive Purge       | Denied  |   Denied    |   Denied    | **Policy Approval Req.** |

---

## 3. Subject Access Request (DSR) Export Workflow

When an individual requests a copy of their personal data:

1. Navigate to `/crm/consent` and search for the individual's canonical email address.
2. Verify requester identity through verified communication channels (e.g., email confirmation).
3. Click **"Export Subject Data (JSON)"**.
4. The system executes `generateSubjectExport()`:
   - Compiles canonical profile, linked organizations, touchpoints, consent timeline, and tasks.
   - **Strictly redacts** internal credentials, machine HMAC tokens, API keys, cookies, and other individuals' personal data.
   - Generates a timestamped JSON document for delivery to the requester.
   - Records an immutable event in `audit_logs`.

---

## 4. Erasure & Anonymization Safety Protocol

Zavlio enforces a two-stage safety protocol for data subject deletion requests:

### Stage 1: Dry-Run Preview (`DRY_RUN_PREVIEW_ONLY`)

- The administrator triggers an anonymization preview.
- The system maps all related records that will be sanitized:
  - Personal identity fields (`first_name`, `last_name`, `phone`, `job_title`) replaced with `[ANONYMIZED]`.
  - Canonical email hashed (`citext`).
  - CRM notes, touchpoints, and timeline entries scrubbed.
  - Audit trail and global DNC suppression flags **strictly preserved** to prevent future accidental re-contacting.

### Stage 2: Destructive Execution Hold (`PENDING_POLICY_APPROVAL`)

- Permanent deletion of historical CRM transactions requires formal written sign-off from qualified legal counsel.
- Until formal retention policies are approved, the platform holds erasure requests in `PENDING_POLICY_APPROVAL`, preventing catastrophic or unreviewed data loss.
