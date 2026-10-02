# Authentication and staff access

## Packet 17 operational closure

Hosted invite-only Auth, PKCE recovery, and role-matrix verification remain external until a hosted Supabase project is supplied; local configuration keeps public signup disabled.

Packet 07 implements invite-only Supabase Auth with SSR cookies and database-backed RBAC.

## Flows

1. A server-side OWNER or ADMIN invites an email. The server checks role scope, sends a Supabase invite with a PKCE confirmation redirect, inserts the linked `staff_profiles` row, and compensates with Auth-user deletion if the profile insert fails.
2. `/auth/confirm` exchanges a code or verifies a token hash, strips the token from the URL, and redirects only to an internal password setup path.
3. `/auth/set-password` requires an authenticated Auth context, enforces a 12-character minimum, updates the password, resolves active staff from the database, and sends authorized users to `/crm`.
4. Login and recovery use generic responses. Logout is a POST. No public signup or registration route exists.

## Authorization

The server resolves `auth.getClaims()` and then joins `staff_profiles.auth_user_id` with `active = true`. Role checks are repeated in route handlers and in RLS policies. The database final-owner trigger prevents the active owner count from reaching zero. Admins cannot touch owners or other admins; owners cannot self-deactivate through the UI.

## Local testing

Run Supabase and Mailpit with `pnpm db:start`, set the public URL/anon key and service-role key only in the process environment, then exercise `pnpm staff:bootstrap-owner -- --email ... --name ...`, the invite page, Mailpit confirmation, login, recovery, and logout. Runtime tests use disposable users and never seed credentials.

## Hosted checklist

- Disable email signup and anonymous sign-ins.
- Configure the production site URL and exact `/auth/confirm` and `/auth/set-password` redirect URLs.
- Keep service-role credentials server-side only; rotate them through the deployment secret manager.
- Configure SMTP and verify invite/recovery delivery before enabling staff access.
- Add MFA and step-up authentication as a later security packet; Packet 07 does not claim MFA.

## Local runtime caveat

Supabase CLI `2.118.0` currently maps `auth.enable_signup = false` to both `GOTRUE_DISABLE_SIGNUP=true` and `GOTRUE_EXTERNAL_EMAIL_ENABLED=false`. That preserves the required public-signup denial but also disables email/password login in the local container. The application code and invite flow are implemented; hosted verification must use a Supabase configuration where email/password is enabled while signup remains disabled. This is tracked as an external dependency rather than weakened by enabling public signup locally.
