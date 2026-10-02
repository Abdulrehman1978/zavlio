ZAVLIO

Production-Grade Digital Experience, CRM, Lead Intelligence & Meta Automation Platform

Master Build Specification — Version 2.0

Purpose: This document is the single authoritative build specification for the Zavlio platform.
It is intentionally detailed so a coding agent can execute the project across many long sessions without losing architectural context or silently changing product direction.

0. EXECUTIVE SUMMARY

Zavlio must not be built as a simple agency landing page.

It must be built as a production-grade business platform with five tightly coordinated layers:

Premium Public Experience

editorial, high-end, image-rich, motion-rich, visually distinctive

warm ivory art direction

rich portfolio, services, insights, lab, about, project enquiry

immersive but performance-conscious 3D and animation

First-Party Analytics & Identity Layer

anonymous visitor IDs

sessions

first-party events

UTM/referrer attribution

anonymous-to-known identity resolution

consent-aware tracking

CRM & Revenue Layer

people

organizations

identities

leads

lead scores

opportunities

tasks

conversations

notes

consent

activity timeline

pipeline

internal analytics

Automation Layer

secure automation job queue

human approval modes

idempotent job execution

Meta Automation bridge

social lead ingestion

outreach history

retry/failure/manual-action states

Operational Layer

auth

RBAC

RLS

CI/CD

security

privacy

observability

backup/recovery

staging

deployment

test evidence

documentation

release gates

The public website must feel simple, elegant, premium, human, creative and international.

The internal platform may be sophisticated, but that complexity must stay behind the scenes.

1. NON-NEGOTIABLE PRODUCT PRINCIPLES

These rules override normal implementation preferences.

1.1 Public experience

The public website must:

preserve the approved Zavlio warm-ivory editorial identity

feel premium, modern, cinematic and tactile

be highly visual

use strong typography

use large imagery

use selective motion and 3D

remain fast

remain understandable

remain accessible

remain responsive

remain credible

avoid generic SaaS aesthetics

avoid generic AI aesthetics

avoid generic dark cyberpunk aesthetics

avoid excessive cards, pills and dashboard chrome

1.2 CRM

The CRM must:

be the durable source of truth

prioritize operational clarity over visual spectacle

use relational data properly

maintain a complete customer timeline

preserve auditability

distinguish lifecycle state from deal stage

support identity resolution conservatively

support do-not-contact and consent enforcement

support future expansion without a rewrite

1.3 Automation

Meta Automation is:

an execution agent

not the CRM

not the permanent database

not the source of truth

The automation layer must:

receive scoped jobs

act only within configured policy

stop on security checkpoints

verify actions

report results back

preserve human approval options

never silently convert failure into success

1.4 Data

Anonymous visitors are not automatically known people.

Do not:

fingerprint browsers

infer real identity without evidence

silently merge weak identity matches

expose privileged credentials to the browser

store unnecessary personal data

bypass consent logic

auto-contact people marked do-not-contact

2. SOURCE OF TRUTH ORDER

When implementation sources conflict, use this priority:

MASTER_SPEC.md

explicit user instruction

latest approved Zavlio Stitch design

approved Zavlio design-system export

existing Zavlio implementation

Zavlio architecture documentation

Zavlio CRM documentation

Zavlio Meta Automation integration documentation

pinned Meta Automation upstream revision

framework defaults / engineering judgment

Every meaningful conflict must be recorded in:

docs/DECISIONS.md

Never silently choose one interpretation if it materially changes architecture, user experience, privacy, or data behavior.

3. WORKING MODE FOR THE CODING AGENT

The coding agent must work like a senior engineer maintaining a long-running production project.

3.1 Before coding

Before the first implementation change:

inspect the full repository

inspect the latest Stitch export

inspect existing assets

inspect design tokens

inspect routes

inspect current package manager

inspect current framework versions

inspect database setup

inspect environment handling

inspect tests

inspect CI

inspect the pinned Meta Automation revision

inspect known runtime assumptions

identify what is already working

identify what must be preserved

identify what is incomplete

identify external dependencies

Create:

docs/CURRENT_STATE_AUDIT.md

docs/IMPLEMENTATION_PLAN.md

Then stop.

Do not begin major implementation until the audit and plan are complete.

3.2 Context-loss prevention

Create and maintain:

docs/PROGRESS_TRACKER.md

docs/IMPLEMENTATION_LEDGER.md

docs/DECISIONS.md

docs/ASSUMPTION_REGISTER.md

docs/RISKS.md

docs/KNOWN_LIMITATIONS.md

After every work packet:

summarize exactly what changed

record commands run

record tests run

record failures

record external blockers

record new assumptions

record migration state

record next packet

record exact files that matter next

The agent must be able to resume safely from these files after context loss.

4. REQUIRED DOCUMENTATION

Create this documentation structure at project start.

/
├── AGENTS.md
├── MASTER_SPEC.md
├── README.md
│
└── docs/
    ├── CURRENT_STATE_AUDIT.md
    ├── IMPLEMENTATION_PLAN.md
    ├── PROGRESS_TRACKER.md
    ├── IMPLEMENTATION_LEDGER.md
    ├── ARCHITECTURE.md
    ├── PRODUCT_SCOPE.md
    ├── ROUTES.md
    ├── DESIGN_SYSTEM.md
    ├── CONTENT_ARCHITECTURE.md
    ├── CRM_SPEC.md
    ├── DATA_MODEL.md
    ├── EVENT_TAXONOMY.md
    ├── IDENTITY_RESOLUTION.md
    ├── LEAD_SCORING.md
    ├── AUTOMATION_ARCHITECTURE.md
    ├── META_AUTOMATION_INTEGRATION.md
    ├── AUTOMATION_POLICY.md
    ├── SECURITY.md
    ├── PRIVACY_AND_CONSENT.md
    ├── ACCESSIBILITY.md
    ├── PERFORMANCE.md
    ├── SEO.md
    ├── OBSERVABILITY.md
    ├── TESTING.md
    ├── DEPLOYMENT.md
    ├── ENVIRONMENT.md
    ├── RUNBOOK.md
    ├── BACKUP_AND_RECOVERY.md
    ├── THIRD_PARTY_DEPENDENCIES.md
    ├── ASSET_REGISTER.md
    ├── DECISIONS.md
    ├── ASSUMPTION_REGISTER.md
    ├── RISKS.md
    ├── KNOWN_LIMITATIONS.md
    ├── CLAIMS_REGISTER.md
    ├── RELEASE_CHECKLIST.md
    └── work/
        ├── 00-result.md
        ├── 01-result.md
        ├── 02-result.md
        └── ...

5. AGENTS.md RULES

AGENTS.md should be short and authoritative.

It must state:

MASTER_SPEC.md is authoritative

inspect before editing

do not redesign approved Zavlio UI

use strict TypeScript

never expose secrets

do not bypass RLS

never use client-side authorization as the only authorization

use migrations for database changes

never mutate production schema manually

tests must ship with features

demo/sample content is allowed only under controlled demo/staging rules

production claims must be reviewed

do not modify pinned Meta Automation upstream code unless necessary

prefer adapters over invasive forks

update progress documents after each packet

never call a packet complete without evidence

6. PRODUCT DEFINITION

Zavlio is a broad multidisciplinary company.

Primary capability pillars:

Strategy

research

positioning

brand strategy

digital strategy

product strategy

go-to-market

growth strategy

Design

visual identity

creative direction

UI/UX

web design

product design

design systems

motion

content design

Technology

websites

applications

digital products

ecommerce

CMS

integrations

AI

automation

technical systems

Growth

content

SEO

paid media

social

campaigns

CRO

lead generation

analytics

Zavlio must remain broad enough to later support:

software products

AI products

commerce

internal tools

ventures

new service lines

subscriptions

packaged services

products unrelated to agency work

Never structurally lock the platform into the phrase “digital marketing agency.”

7. APPROVED PUBLIC VISUAL DIRECTION

The latest approved Stitch design is the visual source of truth.

7.1 Brand personality

Target:

sophisticated

warm

editorial

spatial

tactile

premium

restrained

intelligent

creative

technically credible

contemporary

Avoid:

generic SaaS

generic AI

Web3

cyberpunk

excessive glassmorphism

neon RGB

infinite floating cards

over-rounded UI

generic gradient blobs

dashboard-heavy public pages

7.2 Color system

Suggested core:

Warm Ivory:      #F5F2EA
Elevated Ivory:  #FAF8F4
Pure White:      #FFFFFF
Primary Ink:     #0D0D0D
Graphite:        #171717
Warm Neutral:    #A9A49A
Rule / Border:   #D8D4CA
Accent Acid:     #D8FF45

The public site should remain mostly warm/light.

Accent should be used sparingly.

7.3 Typography

Preferred:

Hanken Grotesk — primary UI / sans

Newsreader — editorial serif

Space Grotesk — labels / metadata / technical UI

Load fonts responsibly.

Prevent layout shift.

Use valid licensing.

7.4 Geometry

Public experience:

sharp

editorial

mostly 0–4px radius

large spacing

large image blocks

strong grid

strong type scale

CRM can be slightly softer where usability benefits.

8. MOTION, MEDIA & 3D

Use motion to create memory, not noise.

8.1 Libraries

Preferred:

Motion for React for component animation

GSAP + ScrollTrigger for complex scroll choreography

Three.js / React Three Fiber / Drei only for selective 3D

8.2 3D use

Allowed for:

hero spatial composition

signature Zavlio system

Zavlio Lab

selected case-study moments

small brand object

Not allowed for:

every page

every card

CRM

basic forms

8.3 Signature sequence

The primary immersive sequence:

IDEA
→ IDENTITY
→ EXPERIENCE
→ SYSTEM
→ GROWTH
→ INSIGHT
→ IDEA

This must be a true visual transformation.

Do not implement it as six cards.

8.4 Reduced motion

Every motion-heavy experience must support:

prefers-reduced-motion

static semantic fallback

mobile fallback

WebGL failure fallback

poster fallback

8.5 Performance

Use:

GLB

Draco where appropriate

compressed textures

AVIF/WebP

lazy loaded video

poster frames

dynamic imports

deferred Three.js loading

9. RECOMMENDED TECH STACK

Use a modular monolith.

Do not begin with microservices.

Runtime

Node.js 22 LTS or current supported LTS

pnpm workspaces

strict TypeScript

Web application

Next.js App Router

React

React Server Components

Route Handlers

Server Actions only where appropriate

Suspense / streaming

Metadata API

Pin exact versions in package.json.

Record chosen versions in docs/ENVIRONMENT.md.

Styling

Tailwind CSS

CSS variables

custom Zavlio design primitives

Radix primitives only when helpful

Do not visually inherit a generic component-library theme.

Forms

React Hook Form

Zod

All important payloads must be validated server-side.

Database / auth / storage

Use Supabase:

PostgreSQL

Supabase Auth

Storage

RLS

SQL migrations

generated database types

Internal data UI

TanStack Table

dnd-kit

Recharts only inside CRM

Email

Adapter pattern.

Initial provider:

Zoho SMTP

Nodemailer

Future adapters may support:

Resend

Postmark

SES

Bot protection

Support Cloudflare Turnstile.

Testing

Vitest

React Testing Library

Playwright

axe-core

Deployment

Preferred:

Vercel — Next.js

Supabase — database/auth/storage

zavlio.online — production domain

Automation

Use:

sunmughan/meta-automation

as a separate automation runtime.

10. REPOSITORY LAYOUT

Recommended:

zavlio/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       ├── public/
│       └── styles/
│
├── packages/
│   ├── ui/
│   ├── db/
│   ├── crm/
│   ├── analytics/
│   ├── automation/
│   ├── validation/
│   ├── email/
│   └── config/
│
├── services/
│   └── meta-bridge/
│
├── external/
│   └── meta-automation/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
│
├── scripts/
├── tests/
├── docs/
├── AGENTS.md
├── MASTER_SPEC.md
├── package.json
├── pnpm-workspace.yaml
└── README.md

11. META AUTOMATION SOURCE MANAGEMENT

Do not copy arbitrary upstream files into application code.

Use one of:

pinned git submodule

pinned fork

pinned vendor snapshot

Record:

upstream URL

branch

commit SHA

local patches

update method

compatibility notes

in:

docs/THIRD_PARTY_DEPENDENCIES.md

Prefer adapters around upstream.

Do not deeply fork unless required.

12. ROUTES

Public

/
/work
/work/[slug]
/services
/services/strategy
/services/design
/services/technology
/services/growth
/about
/lab
/lab/[slug]
/insights
/insights/[slug]
/start-a-project
/contact
/privacy
/terms
/cookies
/login

CRM

/crm
/crm/people
/crm/people/[id]
/crm/organizations
/crm/organizations/[id]
/crm/pipeline
/crm/opportunities/[id]
/crm/tasks
/crm/conversations
/crm/automation
/crm/campaigns
/crm/analytics
/crm/consent
/crm/audit
/crm/content
/crm/settings

Future portal

/portal

Do not prominently expose portal until functional.

13. PUBLIC HOMEPAGE STRUCTURE

Required flow:

Hero

Showreel

Manifesto

Selected Work

Capabilities

Zavlio System

How We Work

Zavlio Lab

Human / About

Insights

Final CTA

Footer

Hero

Copy direction:

BUILD
WHAT'S
NEXT.

Supporting:

We build brands, products and digital systems that move businesses forward.

CTA:

Start a Project

Explore Work

Use approved spatial/3D visual.

Showreel

large

cinematic

minimal controls

poster fallback

muted autoplay only where appropriate

accessible pause/play

Work

Support:

project title

slug

type

year

disciplines

hero media

gallery

motion/video

optional 3D

results

testimonial

award

related projects

demo/verified status

Lab

Clearly distinguish self-initiated experiments from commercial work.

Insights

Support:

title

slug

category

author

date

read time

hero image

rich body

SEO

related articles

related work

14. CONTENT MANAGEMENT

V1 can use Postgres-backed content management inside CRM rather than adding a separate CMS unless an excellent CMS is already integrated.

Required entities:

services

projects

project_media

lab_projects

insights

authors

testimonials

site_settings

navigation_items

footer_links

reusable_content_blocks

Statuses:

draft

published

archived

Support:

published_at

created_at

updated_at

created_by

updated_by

SEO title

SEO description

OG image

canonical

visibility

demo flag

verified flag

15. DEMO VS PRODUCTION CONTENT

Use:

CONTENT_MODE=demo

for local/staging.

Use:

CONTENT_MODE=production

for public launch.

Every major claim may have:

DEMO
UNVERIFIED
VERIFIED
RETIRED

Claims include:

client metrics

testimonials

awards

revenue claims

conversion claims

client logos

named case-study results

Maintain:

docs/CLAIMS_REGISTER.md

Production should not silently display demo-only claims when claim enforcement is enabled.

16. FIRST-PARTY VISITOR IDENTITY

Create a random first-party browser visitor ID.

Example cookie:

zv_vid

Requirements:

cryptographically random UUID

Secure in production

SameSite=Lax

reasonable expiry

no PII embedded

Do not fingerprint.

Anonymous visitor records:

visitor key

first seen

last seen

first source

first landing page

first referrer

last source

session count

linked person nullable

consent state

Anonymous does not mean identified.

17. SESSION MODEL

Each session should support:

visitor ID

person ID nullable

started at

ended at

landing page

referrer

UTM source

UTM medium

UTM campaign

UTM content

device category

coarse country/region only if appropriate

metadata

Session timeout must be configurable.

Do not rely solely on third-party analytics definitions.

18. EVENT TAXONOMY

Create a first-party event ingestion system.

Core events:

session_started
page_viewed
service_viewed
project_viewed
lab_project_viewed
insight_viewed
showreel_started
showreel_completed
cta_clicked
start_project_opened
project_form_started
project_form_step_completed
project_form_abandoned
project_form_submitted
contact_form_submitted
login_started
login_completed
outbound_social_click
download_clicked
cookie_preferences_updated

Optional later:

newsletter_subscribed
meeting_booked
proposal_viewed
client_portal_viewed
resource_downloaded

Event fields:

id

visitor_id

person_id nullable

session_id

event_name

occurred_at UTC

page_path

referrer

UTM fields

device category

metadata JSONB

consent snapshot

Do not store passwords, card data, or unnecessary sensitive data in event metadata.

19. EVENT DELIVERY

Do not fire an expensive database write for every trivial DOM event.

Use:

event batching

queued client event buffer

sendBeacon for unload where appropriate

server-side validation

rate limiting

reasonable batch size

event deduplication

request IDs

Critical events such as form submission should be persisted immediately.

20. DATABASE MODEL

Use UUID primary keys unless strong reason otherwise.

Store timestamps in UTC.

Add proper indexes.

Use migrations.

Do not manually mutate production tables.

Core tables follow.

21. STAFF PROFILES

staff_profiles

Fields:

id

auth_user_id

name

email

role

avatar_url

active

created_at

updated_at

Roles:

OWNER
ADMIN
OPERATOR
VIEWER

22. ANONYMOUS VISITORS

anonymous_visitors

Fields:

id

visitor_key unique

first_seen_at

last_seen_at

first_source

first_referrer

first_landing_page

last_source

session_count

linked_person_id nullable

created_at

updated_at

Indexes:

visitor_key

linked_person_id

last_seen_at

23. SESSIONS

sessions

Fields:

id

visitor_id

person_id nullable

started_at

ended_at nullable

landing_page

referrer

UTM fields

device_category

country nullable

metadata JSONB

Indexes:

visitor_id

person_id

started_at

24. PEOPLE

people

Fields:

id

first_name

last_name

display_name

primary_email nullable

primary_phone nullable

job_title nullable

organization_id nullable

lifecycle_stage

lead_status

lead_source

owner_id nullable

do_not_contact boolean

first_touch_source

latest_touch_source

created_at

updated_at

last_activity_at

Lifecycle:

IDENTIFIED
ENGAGED
QUALIFIED
OPPORTUNITY
CLIENT
RETURNING_CLIENT
LOST
ARCHIVED

ANONYMOUS belongs in anonymous visitor state, not necessarily as a people row.

25. ORGANIZATIONS

organizations

Fields:

id

name

domain

website

industry

size_range nullable

country nullable

notes nullable

created_at

updated_at

26. IDENTITIES

identities

Fields:

id

person_id

provider

provider_user_id nullable

username nullable

profile_url nullable

email nullable

verified boolean

confidence numeric

source

discovered_at

last_seen_at

Providers may include:

email
website
google
instagram
threads
facebook
linkedin
client_portal

27. IDENTITY CANDIDATES

Create an explicit possible-match queue.

identity_match_candidates

Fields:

id

person_a

person_b

confidence

match_reasons JSONB

status

reviewed_by nullable

reviewed_at nullable

created_at

Statuses:

PENDING
CONFIRMED
REJECTED
AUTO_CONFIRMED

Only high-confidence deterministic matches should auto-merge.

28. EVENTS

events

Fields:

id

visitor_id nullable

person_id nullable

session_id nullable

event_name

page_path

occurred_at

metadata JSONB

consent_snapshot JSONB

Indexes:

visitor_id

person_id

session_id

event_name

occurred_at

(person_id, occurred_at)

(event_name, occurred_at)

29. CONSENTS

consents

Fields:

id

person_id nullable

visitor_id nullable

analytics boolean

marketing_email boolean

marketing_social boolean

personalization boolean

policy_version

captured_at

withdrawn_at nullable

source

metadata JSONB

Consent history must not be overwritten.

Append new records for material consent state changes.

30. FORM SUBMISSIONS

form_submissions

Fields:

id

person_id nullable

visitor_id nullable

form_type

payload JSONB

status

idempotency_key

submitted_at

source

Server-side validate every payload.

Do not dump secrets or irrelevant sensitive data into JSON.

31. LEAD SCORES

lead_scores

Fields:

id

person_id

score

intent_level

service_interest JSONB

reasoning JSONB

model_version

calculated_at

Maintain score history, not only current score.

32. PIPELINE STAGES

pipeline_stages

Fields:

id

name

sort_order

color_token

is_closed

is_won

Seed:

New
Qualified
Discovery
Proposal
Negotiation
Won
Lost

33. OPPORTUNITIES

opportunities

Fields:

id

person_id

organization_id nullable

title

stage_id

estimated_value nullable

currency

probability nullable

service_interest JSONB

source

owner_id nullable

expected_close_date nullable

lost_reason nullable

created_at

updated_at

Do not auto-create opportunities for every anonymous visitor.

34. TOUCHPOINTS

touchpoints

Fields:

id

person_id

opportunity_id nullable

channel

type

direction

subject nullable

content_summary nullable

external_reference nullable

occurred_at

created_by_type

created_by_id nullable

automation_run_id nullable

metadata JSONB

Channels:

website
email
instagram
threads
facebook
linkedin
phone
meeting
internal

35. CONVERSATIONS

conversations

Fields:

id

person_id

channel

external_thread_id nullable

status

last_message_at

created_at

updated_at

36. MESSAGES

messages

Fields:

id

conversation_id

person_id

direction

channel

body

external_message_id nullable

status

sent_at nullable

received_at nullable

automation_action_id nullable

created_at

37. TASKS

tasks

Fields:

id

person_id nullable

opportunity_id nullable

assigned_to

title

description nullable

due_at nullable

status

priority

created_at

updated_at

completed_at nullable

38. NOTES

notes

Fields:

id

person_id nullable

organization_id nullable

opportunity_id nullable

author_id

body

visibility

created_at

updated_at

39. AUTOMATION JOBS

automation_jobs

Fields:

id

person_id nullable

opportunity_id nullable

type

channel

priority

status

payload JSONB

scheduled_for

claimed_at nullable

claimed_by nullable

attempt_count

max_attempts

idempotency_key unique

created_at

updated_at

Statuses:

QUEUED
CLAIMED
RUNNING
AWAITING_APPROVAL
COMPLETED
FAILED
BLOCKED
MANUAL_ACTION_REQUIRED
CANCELLED

40. AUTOMATION RUNS

automation_runs

Fields:

id

agent_id

started_at

finished_at nullable

status

version

host

metadata JSONB

41. AUTOMATION ACTIONS

automation_actions

Fields:

id

automation_job_id

automation_run_id

person_id nullable

platform

action_type

status

requested_at

executed_at nullable

verified_at nullable

failure_reason nullable

evidence JSONB

content_summary nullable

created_at

42. CAMPAIGNS

campaigns

Fields:

id

name

type

status

starts_at nullable

ends_at nullable

audience_definition JSONB

created_at

updated_at

campaign_members

Fields:

campaign_id

person_id

status

added_at

43. AUDIT LOGS

audit_logs

Fields:

id

actor_type

actor_id nullable

action

entity_type

entity_id nullable

before_state JSONB nullable

after_state JSONB nullable

ip_hash nullable

request_id nullable

created_at

Audit:

staff role changes

opportunity stage changes

consent changes

person merges

do-not-contact changes

automation approvals

automation overrides

deletions

important settings

content publish actions

44. IDENTITY RESOLUTION

Identity resolution is conservative.

High confidence

May auto-link when appropriate:

same verified email

authenticated account

explicit user-linked social account

unique trusted external identifier

manual staff confirmation

Medium confidence

Require review:

same full name + same company

same domain + similar identity

same handle across platforms

matching social links

email pattern + company match

Low confidence

Never auto-merge:

display name only

photo only

location only

similar username only

Manual merge

Must preserve:

events

sessions

identities

conversations

messages

opportunities

tasks

notes

consent

automation history

source attribution

Every merge must be audited.

Provide merge preview.

Provide duplicate-detection UI.

45. LEAD SCORING V1

Make scoring configurable.

Example weights:

Homepage visit                         +1
Service page                           +5
Second distinct service                +4
Project case study                     +7
Multiple projects                      +5
Return session                         +8
Start Project opened                  +15
Project form started                  +20
Project form completed                +40
Contact form submitted                +30
Budget supplied                       +10
High-value service combination        +10
Repeat engagement within 7 days       +10
Relevant social lead discovered       +15
Positive inbound response             +20
Meeting booked                        +30

Do not exceed max score.

Support intent decay.

Suggested levels:

0–24   LOW
25–49  INTERESTED
50–69  WARM
70–84  HIGH
85–100 PRIORITY

Make thresholds configurable.

46. SERVICE AFFINITY

Maintain separate service-interest scoring:

strategy

brand

design

web

technology

ai_automation

ecommerce

growth

content

CRM should be able to show:

Primary interest: Technology
Secondary: Brand

47. CRM DASHBOARD

Show:

new identified leads

high-intent leads

priority leads

opportunities by stage

weighted pipeline

total pipeline

tasks due

overdue tasks

recent form submissions

automation jobs

automation failures

recent social replies

recent won/lost

traffic-to-lead conversion

source quality

Do not overload first viewport.

Use progressive detail.

48. PEOPLE LIST

Table columns:

name

organization

lifecycle

lead score

intent

primary interest

source

owner

last activity

next task

Filters:

lifecycle

score

source

service

owner

consent

do-not-contact

date created

last activity

Support saved views later if easy.

49. PERSON DETAIL

Critical page.

Header:

name

company

role

lifecycle

score

owner

source

last activity

Sections:

overview

timeline

identity

conversations

opportunities

tasks

notes

consent

automation

Timeline must unify:

page visits

service views

project views

form activity

email

DMs

comments

meetings

notes

stage changes

proposals

consent changes

automation actions

50. OPPORTUNITY PIPELINE

Provide:

Kanban

table

Stages:

New

Qualified

Discovery

Proposal

Negotiation

Won

Lost

Drag/drop persistence must be transactional.

Every movement must create:

stage history

audit log

Lost reasons:

budget

timing

no response

competitor

not fit

internal

other

51. START A PROJECT FLOW

Implement approved multi-step flow.

Step 1

What can we help with?

Strategy

Brand

Website

Digital Product

AI / Automation

Growth

Content / Campaign

Not sure yet

Step 2

Name

Work email

Company

Website

Role

Step 3

What are you trying to achieve?

Step 4

Approximate budget:

Exploring

₹1L–₹3L

₹3L–₹7L

₹7L–₹15L

₹15L+

Let's discuss

Keep configurable.

Step 5

Timing:

ASAP

1–2 months

3–6 months

Exploring

Step 6

How did you hear about Zavlio?

Submission workflow

validate server-side

enforce idempotency

resolve visitor

resolve/create person

link prior visitor history

save form

update affinities

calculate score

create timeline events

create task

create opportunity if rules qualify

notify staff

evaluate automation eligibility

return success

never duplicate on retry

52. CONTACT FORM

Fields:

name

email

company optional

message

Still feeds CRM.

No disconnected mailbox-only workflow.

53. CONSENT

Consent is functional data.

Store:

analytics

marketing_email

marketing_social

personalization

policy_version

captured_at

withdrawn_at

source

Cookie UI must be backed by real preference state.

No dark patterns.

54. DO-NOT-CONTACT

do_not_contact = true must block:

automated outreach

manual bulk campaigns

follow-up job creation

social automation

marketing email

One-to-one transactional communication may be separately governed by explicit business logic.

55. STAFF AUTH

Invite-only.

Roles:

OWNER

Full access.

ADMIN

All CRM/content/automation except owner-sensitive settings.

OPERATOR

People, opportunities, tasks, conversations, notes, automation review.

VIEWER

Read-only.

Authorization must be enforced server-side and at the database layer where practical.

56. SUPABASE RLS

Create explicit RLS policies.

Do not disable RLS casually.

Public anonymous users should never query CRM tables directly.

Public form submissions should go through validated server routes/actions.

Privileged operations use server-only service credentials.

Test RLS.

Document RLS matrix in:

docs/SECURITY.md

57. META AUTOMATION ROLE

Meta Automation remains separate.

Architecture:

Zavlio CRM
   ↓
Automation Jobs
   ↓
Meta Bridge
   ↓
Meta Automation
   ↓
Authenticated browser/CDP
   ↓
Social platform
   ↓
Observed result
   ↓
Meta Bridge
   ↓
Zavlio CRM

58. PINNED META AUTOMATION BASELINE

Record upstream revision.

Do not auto-update.

Preserve useful concepts:

semantic live browser observation

next-best-action reasoning

global guard

rate/action budgets

relationship state

identity graph

follow-up scheduler

dry-run

approval mode

action verification

59. META BRIDGE

Create:

services/meta-bridge

This is a local Node runtime.

Responsibilities:

authenticate to Zavlio

heartbeat

poll jobs

claim jobs atomically

transform job into Meta Automation objective

execute

verify

return result

handle retry

report manual-action state

record runtime version

record agent host

Never expose CDP publicly.

60. AUTOMATION INTERNAL API

Conceptual endpoints:

GET  /api/internal/automation/jobs
POST /api/internal/automation/jobs/:id/claim
POST /api/internal/automation/jobs/:id/start
POST /api/internal/automation/jobs/:id/result
POST /api/internal/automation/jobs/:id/manual-action-required
POST /api/internal/automation/touchpoints
POST /api/internal/automation/heartbeat

These are Zavlio internal APIs, not social platform APIs.

61. AUTOMATION AUTH

Use signed machine requests.

At minimum:

Headers:

X-Zavlio-Agent
X-Zavlio-Timestamp
X-Zavlio-Nonce
X-Zavlio-Signature

Use:

HMAC SHA-256

body hash

timestamp

nonce

route

method

Reject:

stale timestamps

reused nonce

invalid signatures

disabled agents

Support secret rotation.

62. AUTOMATION ELIGIBILITY

Before creating or running any outbound automation job verify:

identified person

valid channel

not do-not-contact

consent/policy permits action

cooldown satisfied

not already contacted too frequently

no duplicate job

no pending response

no conflicting opportunity state

channel enabled

automation enabled

approval policy satisfied

63. OUTREACH MODES

Support:

OBSERVE_ONLY
DRAFT_ONLY
APPROVAL_REQUIRED
AUTONOMOUS

Default production:

APPROVAL_REQUIRED

for social outreach.

64. AUTOMATION SETTINGS

CRM settings:

enabled

dry-run

approval mode

allowed platforms

allowed action types

max DMs/hour

max comments/hour

max follows/hour

max connections/hour

max contacts/person/week

max follow-ups

follow-up interval

cooldown

working hours

timezone

Default timezone:

Asia/Kolkata

Store timestamps in UTC.

65. AUTOMATION JOB CLAIMING

Use atomic database claiming.

Example semantic behavior:

QUEUED
→ CLAIMED
→ RUNNING
→ COMPLETED

or:

RUNNING
→ MANUAL_ACTION_REQUIRED

or:

RUNNING
→ FAILED

Two agents must never execute the same job.

Use Postgres transactional semantics.

66. AUTOMATION FAILURE STATES

Support explicit states:

LOGIN_REQUIRED
CAPTCHA
SECURITY_CHALLENGE
ACCOUNT_RESTRICTED
CONTENT_NOT_FOUND
TARGET_NOT_FOUND
AMBIGUOUS_TARGET
RATE_LIMITED
NETWORK_FAILURE
BROWSER_FAILURE
VERIFICATION_FAILED
UNKNOWN_UI
MANUAL_ACTION_REQUIRED

Never silently report success.

67. SECURITY CHECKPOINT POLICY

Never bypass:

CAPTCHA

login verification

identity verification

phone verification

suspicious login

account checkpoint

platform security review

Stop and create:

MANUAL_ACTION_REQUIRED

68. SOCIAL LEAD INGESTION

Meta Automation may independently discover a lead.

Structured ingestion payload may contain:

platform

username

display name

profile URL

evidence

matched service

lead context

conversation context

discovered at

confidence

relevant post URL

CRM must:

resolve identity

create/update person

record identity

add touchpoint

calculate score

create review/opportunity if qualified

avoid duplicates

69. WEBSITE → AUTOMATION FLOW

Example:

Instagram visitor
→ homepage
→ technology
→ project
→ returns next day
→ starts enquiry
→ submits
→ identity resolves
→ score 87
→ opportunity created
→ social identity already known
→ approval-required automation job created
→ staff reviews
→ Meta Automation sends contextual action
→ result returns
→ timeline updated

70. AUTOMATION → CRM FLOW

Every verified automated action must write back:

person

platform

action

content summary

timestamp

job

run

status

verification

failure reason

external reference

Do not rely on local Meta Automation JSON as permanent CRM history.

71. AUTOMATION UI

Route:

/crm/automation

Display:

agent online/offline

last heartbeat

agent version

host

dry-run

approval

platform

queued

running

awaiting approval

failed

manual action

completed

Job detail:

person

lead score

service interest

reason

proposed action

proposed message

prior touchpoints

policy result

execution evidence

status

Actions:

approve

edit & approve

reject

cancel

retry

72. EMAIL

Create adapter interface.

Initial implementation:

Zoho SMTP

Nodemailer

Use email for:

enquiry confirmation

staff notification

approved follow-up

operational messages

Do not automatically subscribe project leads to marketing newsletters.

Log relevant email touchpoints.

73. FIRST-TOUCH / LAST-TOUCH ATTRIBUTION

Store both.

Never overwrite initial source.

Examples:

Instagram

Direct

Google

LinkedIn

Referral

campaign UTM

CRM analytics should compare:

traffic

leads

opportunities

wins

revenue

lead quality

by source.

74. CRM ANALYTICS

Dashboard metrics may include:

visitor IDs

sessions

returning visitor IDs

top pages

top services

top projects

top sources

form starts

form completion

conversion rate

leads by source

lead score distribution

pipeline by stage

revenue by source

service interest distribution

Do not claim anonymous visitor IDs equal unique humans across devices.

75. CONTENT / CRM SEPARATION

Public site:

visual

expressive

motion-rich

image-rich

premium

CRM:

fast

information dense

functional

keyboard friendly

restrained

no heavy 3D

76. SECURITY

Secrets

Never expose:

Supabase service role

SMTP password

HMAC secret

AI provider secrets

automation credentials

Use server-only boundaries.

Headers

Implement appropriate:

CSP

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

HSTS

anti-framing protection

Forms

Use:

rate limits

honeypot

Turnstile if configured

idempotency

validation

duplicate protection

Automation API

Use:

signatures

nonce replay protection

timestamp validation

audit logs

rate limits

77. PRIVACY

Build real:

Privacy Policy

Terms

Cookie Policy

Cookie settings

Technical foundation must support:

data export

correction

withdrawal of consent

do-not-contact

deletion/anonymization

retention policy

subject to applicable legal/business requirements.

Do not require raw SQL to honor basic privacy requests.

78. DATA RETENTION

Create configurable policies.

Potential categories:

anonymous events

sessions

inactive leads

automation logs

security logs

form submissions

audit logs

Do not hard delete business-critical records automatically until retention policy is explicitly approved.

79. SEO

Implement:

title

meta description

canonical

OpenGraph

social cards

sitemap

robots

structured data

breadcrumbs

Article schema

Organization schema

Service schema where appropriate

Do not create fake ratings/reviews schema.

Public content must be crawlable without requiring client-side JS.

80. PERFORMANCE

Target public site:

LCP < 2.5s p75

INP < 200ms p75

CLS < 0.1

Do not load:

Three.js

heavy animation

CRM chart libraries

case-study video

on routes that do not need them.

Use:

next/image

AVIF/WebP

video posters

lazy loading

dynamic imports

code splitting

bundle analysis

81. ACCESSIBILITY

Target WCAG 2.2 AA.

Require:

keyboard navigation

visible focus

semantic headings

labels

error association

skip links

modal focus management

touch targets

video controls

reduced motion

contrast

screen-reader status

Critical information must never exist only inside 3D.

82. OBSERVABILITY

Use structured logs.

Include:

request ID

route

duration

automation job ID

safe person reference

error category

Never log:

passwords

tokens

raw secrets

unnecessary full form payloads

Health checks:

DB

auth config

email

automation heartbeat

83. ENVIRONMENT VARIABLES

Create .env.example.

At minimum:

NEXT_PUBLIC_SITE_URL=https://zavlio.online

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ZOHO_SMTP_HOST=
ZOHO_SMTP_PORT=
ZOHO_SMTP_USER=
ZOHO_SMTP_PASSWORD=
MAIL_FROM=hello@zavlio.online

TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

AUTOMATION_AGENT_ID=
AUTOMATION_HMAC_SECRET=

META_AUTOMATION_ENABLED=false
META_AUTOMATION_APPROVAL_REQUIRED=true

CONTENT_MODE=demo
NEXT_PUBLIC_ENABLE_PORTAL=false

SENTRY_DSN=

Document every variable.

Fail fast for missing production-critical values.

84. TESTING STRATEGY

Tests ship with implementation.

Unit

Test:

score calculation

score decay

service affinity

identity resolution

consent eligibility

do-not-contact

automation eligibility

HMAC

replay protection

event validation

form validation

claim guard

opportunity transitions

demo-content guard

Integration

Test:

anonymous visitor → event

anonymous visitor → person

form → person

form → opportunity

score recalculation

automation job creation

claim

result → timeline

do-not-contact block

consent withdrawal

merge

attribution

E2E

Test:

homepage

navigation

work

service

article

Start Project

cookies

staff login

people

person detail

opportunity

automation approval

automation failure

logout

Accessibility

Run axe on critical routes.

Responsive

Minimum:

390×844

768×1024

1024×768

1440×900

1920×1080

85. VISUAL REGRESSION

Capture approved key routes.

Include:

homepage desktop

homepage mobile

work

case study

services

Start Project

CRM dashboard

Backend work must not degrade public UI.

86. ASSET REGISTER

Maintain:

docs/ASSET_REGISTER.md

For each:

filename

type

source

ownership/license

page

dimensions

responsive variants

poster

compression status

production-ready status

Especially for:

fonts

videos

3D

photography

sample client work

logo marks

87. BACKUP & RECOVERY

Document:

DB backup

restore procedure

migration rollback

storage backup

automation state recovery

secret rotation

disaster recovery

incident response

Test restore in staging before calling the project production-ready.

88. DEPLOYMENT ENVIRONMENTS

Use:

LOCAL
STAGING
PRODUCTION

Separate database/configuration.

Staging:

demo content

automation dry-run or disabled

test email recipient override

Production:

verified content

real secrets

explicit automation policy

claim guard enabled

89. CI PIPELINE

Run:

install

formatting check

lint

typecheck

unit tests

integration tests

migration validation

production build

security audit

selected Playwright smoke

demo-claim guard

Fail CI on critical failure.

90. RELEASE GATES

Public site gate

Must pass:

design fidelity

navigation

responsive

forms

SEO

accessibility

privacy UI

cookie controls

performance

production-content review

CRM gate

Must pass:

auth

RBAC

RLS

people

timeline

identity

scoring

pipeline

tasks

audit

Automation gate

Must pass:

HMAC

heartbeat

dry-run

job claim

approval

do-not-contact

rate limit

security pause

verification

result sync

Operations gate

Must pass:

staging

production build

backup

recovery

rollback

documentation

known-limitations review

91. WORK PACKETS

Work in this order.

Packet 00 — Audit

Deliver:

CURRENT_STATE_AUDIT.md

IMPLEMENTATION_PLAN.md

No major build.

Packet 01 — Repository foundation

workspace

strict TS

lint

formatting

env validation

CI

test harness

docs skeleton

Packet 02 — Design system

tokens

typography

layout

header

footer

buttons

media

motion primitives

responsive foundation

Packet 03 — Homepage

approved warm ivory design

hero

showreel

selected work

capabilities

Zavlio system

lab

about

insights

CTA

Packet 04 — Public routes

work

case study

services

service detail

about

lab

lab detail

insights

article

contact

legal

404

Packet 05 — Premium motion / 3D

hero spatial scene

showreel

transitions

signature sequence

reduced-motion

fallbacks

mobile

Packet 06 — Database

Supabase

migrations

RLS

generated types

seed

tests

Packet 07 — Auth

staff auth

roles

protected CRM

RLS validation

Packet 08 — Analytics

visitor ID

sessions

event ingestion

attribution

consent-aware tracking

Packet 09 — Forms / identity

Start Project

contact

person resolution

visitor linking

email

Packet 10 — CRM people

list

detail

timeline

identities

notes

consent

merge

Packet 11 — Pipeline

opportunity

Kanban

tasks

score

affinity

Packet 12 — Analytics dashboard

traffic

leads

source

conversion

pipeline

Packet 13 — Automation queue

jobs

claims

approvals

settings

agent status

Packet 14 — Meta Bridge

HMAC

polling

heartbeat

claim

result

retry

Packet 15 — Meta Automation adapter

pinned upstream

job translation

dry-run

browser execution

result verification

Packet 16 — Social lead ingestion

inbound social lead

identity resolution

touchpoint

score

opportunity

Packet 17 — Security / privacy

RLS audit

headers

rate limits

Turnstile

data export

consent

deletion

DNC

Packet 18 — SEO / performance / accessibility

SEO

structured data

optimization

bundle audit

WCAG

Packet 19 — Production rehearsal

Fresh environment.

Run:

migrations

seed

build

deploy

form flow

CRM

automation dry-run

approval

simulated manual-action-required

restore test

Packet 20 — Final handoff

Deliver:

final README

deployment guide

admin guide

CRM guide

automation guide

incident runbook

backup guide

environment guide

architecture

DB diagram

route inventory

test evidence

limitations

release checklist

92. PACKET RESULT FORMAT

After every packet write:

docs/work/XX-result.md

Template:

# Packet XX Result

## Scope

## Files Changed

## Database Changes

## APIs Added/Changed

## UI Added/Changed

## Security/Privacy Impact

## Tests Run

## Test Results

## Manual Verification

## Screens/Routes Verified

## External Dependencies

## Known Limitations

## Risks

## Rollback Notes

## Next Packet Readiness

STATUS:
PASS
or
PASS_WITH_EXTERNAL_DEPENDENCY
or
BLOCKED

Also update PROGRESS_TRACKER.md.

93. NO FALSE “PRODUCTION READY”

Do not say production-ready unless all relevant release gates have evidence.

Do not infer success from compilation alone.

Do not mark external systems as verified unless actually exercised.

If a real Meta Automation/browser test cannot be run:

status must explicitly say:

PASS_WITH_EXTERNAL_DEPENDENCY

and identify the missing dependency.

94. DEFINITION OF DONE

The build is complete only when all of the following are true.

Public

premium site implemented

approved UI preserved

desktop/tablet/mobile complete

motion works

3D has fallbacks

forms work

SEO works

accessibility reviewed

performance acceptable

CRM

staff login works

RLS works

visitor/event system works

people work

timeline works

identities work

lead scoring works

pipeline works

tasks work

consent works

audit works

Automation

bridge connects

heartbeat works

jobs claim atomically

dry-run works

approval works

do-not-contact blocks

security pause works

actions verify

results sync

Operations

CI passes

staging works

deployment documented

restore documented

rollback documented

secrets documented

limitations documented

release checklist complete

95. FINAL ARCHITECTURE

                           ┌───────────────────────┐
                           │     zavlio.online     │
                           │ Premium Public Site   │
                           └───────────┬───────────┘
                                       │
                            First-party events
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │ Visitors / Sessions   │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │ Identity Resolution   │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │      ZAVLIO CRM       │
                           │     PostgreSQL        │
                           │                       │
                           │ People                │
                           │ Organizations         │
                           │ Events                │
                           │ Identities            │
                           │ Opportunities         │
                           │ Tasks                 │
                           │ Conversations         │
                           │ Consent               │
                           │ Lead Intelligence     │
                           └───────────┬───────────┘
                                       │
                              eligible action
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │ Automation Job Queue  │
                           └───────────┬───────────┘
                                       │
                               signed internal API
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │      Meta Bridge      │
                           │ Local / PC / Termux   │
                           └───────────┬───────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │   Meta Automation     │
                           │ Observe / Reason      │
                           │ Act / Verify          │
                           └───────────┬───────────┘
                                       │
                                  browser/CDP
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
                 Threads           Facebook           LinkedIn
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                verified result
                                       │
                                       ▼
                                  ZAVLIO CRM

96. FINAL ENGINEERING PRINCIPLES

CRM is the durable source of truth.

Meta Automation is an execution layer.

Anonymous visitors are not assumed to be known people.

Identity resolution must be conservative.

Consent and do-not-contact must be enforceable in code.

Public UX remains simple.

CRM UX remains operational.

Automation must be observable.

Automation failures must be explicit.

Security checkpoints require human intervention.

All major side effects require auditability.

Demo content may exist in staging.

Production claims require review.

3D must not destroy performance.

The platform should remain broad enough for Zavlio to evolve.

Avoid premature microservices.

Use migrations.

Use strict TypeScript.

Ship tests with features.

Never call something verified without evidence.

97. FIRST INSTRUCTION TO THE CODING AGENT

Do not begin coding immediately.

Your first task is:

read this specification completely

inspect the existing Zavlio repository

inspect the latest Stitch export

inspect all available assets

inspect the pinned Meta Automation repository

inspect current architecture

inspect current dependencies

inspect current environment

inspect current tests

identify reusable implementation

identify conflicts

identify missing credentials

identify external dependencies

create documentation skeletons

produce:

docs/CURRENT_STATE_AUDIT.md

and

docs/IMPLEMENTATION_PLAN.md

The implementation plan must contain:

current architecture

target architecture

migration strategy

preserve/replace decisions

design implementation strategy

database plan

RLS plan

CRM plan

analytics plan

identity resolution plan

automation plan

Meta Automation integration plan

security plan

privacy plan

SEO plan

accessibility plan

performance plan

test plan

deployment plan

rollback plan

external dependency list

risk list

exact work packet sequence

Then stop and wait for review.

END OF MASTER SPECIFICATION