# Operator Guide: Campaigns Workspace (`/crm/campaigns`)

**Workspace**: `C:\zavlio`  
**Audience**: CRM Operators, Marketing Staff, Administrators  
**Route**: `/crm/campaigns`

---

## 1. Overview & Capabilities

The Campaigns workspace provides an internal planning and cohort review tool for:

- Creating and scheduling targeted communication cohorts.
- Linking people and organizations to campaigns.
- Reviewing audience size, objective descriptions, and UTM campaign references.
- Visualizing global DNC (Do Not Contact) and consent suppression states.

**Critical Non-Negotiable**: Zavlio does NOT include an autonomous mass-email or social direct-messaging engine. Campaigns are internal planning entities only; all outreach actions must be reviewed and executed through individual, compliant channels.

---

## 2. Permissions & Roles (RBAC)

| Action                         | VIEWER  |  OPERATOR   |    ADMIN    |    OWNER    |
| :----------------------------- | :-----: | :---------: | :---------: | :---------: |
| View campaigns & audience list | Allowed |   Allowed   |   Allowed   |   Allowed   |
| Create new campaign            | Denied  | **Allowed** | **Allowed** | **Allowed** |
| Add / remove members           | Denied  | **Allowed** | **Allowed** | **Allowed** |
| Pause / Complete campaign      | Denied  | **Allowed** | **Allowed** | **Allowed** |
| Archive campaign               | Denied  |   Denied    | **Allowed** | **Allowed** |

---

## 3. Campaign Types & Status Invariants

### Types

- `OUTREACH_MANUAL`: Hand-curated outbound contact cohorts for key accounts.
- `CONTENT_PROMOTION`: Segment for sharing new research publications or case studies.
- `RESEARCH_COHORT`: Technical benchmarking or user interview cohort.
- `EVENT_INVITATION`: Direct invitation list for studio webinars or roundtables.
- `PARTNERSHIP`: Strategic technology partner collaboration initiatives.

### Lifecycle Statuses

- `DRAFT`: In planning; members can be added/removed freely.
- `ACTIVE`: Currently being executed manually by staff.
- `PAUSED`: Temporarily suspended; no staff outreach.
- `COMPLETED`: Objective achieved or date window elapsed.
- `ARCHIVED`: Closed historical record; immutable.

---

## 4. Consent & Do Not Contact (DNC) Enforcement

When a person is added to a campaign, the system automatically checks their global consent and DNC status:

- If `do_not_contact: true` on the person record, the membership status is automatically set to `EXCLUDED`.
- A prominent red `DNC_SUPPRESSED` badge is displayed in the CRM UI.
- Staff members are barred from initiating proactive outreach to excluded contacts.
- If two people are merged in `/crm/people`, campaign memberships automatically resolve to the surviving canonical person without duplicate entries.
