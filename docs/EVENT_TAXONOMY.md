# Event Taxonomy

Status: Packet 08 implemented. Schema version `1`; endpoint `POST /api/analytics/events`.

All events require analytics consent, a UUID `id`, an ISO timestamp, and an allowlisted name. A request accepts at most 20 events, body size is 64 KiB, metadata is 4 KiB, and duplicate IDs are idempotently ignored. Page paths are same-site paths only; CRM, auth, login, and API paths are excluded. Form metadata contains only opaque form/step identifiers—never field values, email, phone, passwords, message text, or tokens.

| Event                                     | Safe metadata                                | Emitted by                  |
| ----------------------------------------- | -------------------------------------------- | --------------------------- |
| `session_started`                         | none                                         | first page in a new session |
| `page_viewed`                             | none                                         | public route change         |
| `service_viewed`                          | `serviceSlug`                                | service detail              |
| `project_viewed`                          | `projectSlug`                                | project detail              |
| `lab_project_viewed`                      | `projectSlug`                                | lab detail                  |
| `insight_viewed`                          | `insightSlug`                                | insight detail              |
| `showreel_started` / `showreel_completed` | none                                         | showreel lifecycle          |
| `cta_clicked`                             | `ctaId`, optional placement/destination      | public CTA                  |
| `start_project_opened`                    | none                                         | project-start CTA           |
| `project_form_started`                    | `formId`                                     | form start                  |
| `project_form_step_completed`             | `formId`, numeric `step`, optional `stepKey` | form step                   |
| `project_form_abandoned`                  | `formId`, optional step/stepKey              | form abandonment            |
| `project_form_submitted`                  | `formId`                                     | successful project form     |
| `contact_form_submitted`                  | `formId`                                     | successful contact form     |
| `login_started` / `login_completed`       | route; outcome (`success`/`failure`)         | auth UI (no credentials)    |
| `outbound_social_click`                   | platform, destination                        | approved social link        |
| `download_clicked`                        | assetId, optional assetType/path             | public download             |
| `cookie_preferences_updated`              | four boolean preference flags                | consent UI                  |

Attribution context is normalized first-touch/session data: source, medium, campaign, term, content, sanitized referrer, landing path, coarse device category, and optional two-letter country. No fingerprint, raw IP, cross-device link, third-party pixel, or identity/CRM association is performed in Packet 08.

## Packet 09 form events

`project_form_submitted` and `contact_form_submitted` are emitted only after a successful form response and only when analytics consent is valid. Event metadata contains the safe form identifier and submission outcome only; names, messages, budgets, emails, and other free text are never sent to analytics.

## Packet 12 reporting use

Tracked page views and public-content engagement aggregate consented `events.occurred_at`. Successful enquiry metrics remain authoritative from processed `form_submissions`, so analytics submission events are never double-counted as business enquiries. CRM dashboard views remain excluded from public analytics instrumentation.
