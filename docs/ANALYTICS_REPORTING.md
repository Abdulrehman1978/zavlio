# CRM Analytics Reporting

## Packet 17 operational closure

Slow analytics queries are observable with bounded duration/error fields; raw IP, full user agents, form contents, and emails remain excluded from first-party analytics.

`/crm/analytics` is a dynamic, staff-only Server Component route with URL state (`tab`, `range`, `from`, `to`). Tabs are Overview, Acquisition, Leads, Pipeline, and Operations. The browser receives typed aggregate contracts, not raw event/person datasets.

PostgreSQL owns aggregation through five stable, security-invoker RPCs: `crm_analytics_overview`, `crm_analytics_acquisition`, `crm_analytics_leads`, `crm_analytics_pipeline`, and `crm_analytics_operations`. `assert_crm_analytics_range` validates active staff, ordering, and the 730-day limit. EXECUTE is restricted to `authenticated`; anon has no grant. The underlying RLS policies keep their active-staff predicate and use a scalar subquery so PostgreSQL evaluates the stable authorization check once per statement rather than once per row.

The server query layer logs report key, duration, and range days only. It does not log filters containing PII or result data. Queries longer than `CRM_ANALYTICS_SLOW_QUERY_MS` are warnings. Responses are dynamic/private by architecture (`force-dynamic`, `revalidate = 0`) and are not placed in public/shared caches.

Recharts 3.10.1 is isolated to `analytics-chart.tsx`, a small Client Component. Data loading and shaping remain server-side. Animation is disabled. Every chart has a title, description, screen-reader label, empty state, and exact HTML table. Tables are horizontally contained on narrow screens.

The report layer is read-only. Loading reports does not recalculate scores, touch CRM records, create analytics events, update sessions, or write audit records.
