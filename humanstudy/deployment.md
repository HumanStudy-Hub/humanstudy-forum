# Hosted HumanStudy Forum

The forum remains a separate ForumMagnum application at https://forum.humanstudy-hub.com,
linked from the main website through `/forum`. It shares the existing Hub Supabase project
and Supabase Auth with web and desktop; it does not require a second account or paid project.

## Shared resources

- Repository: `HumanStudy-Hub/humanstudy-forum`
- Vercel project: `humanstudy-forum`, team `xuanl17s-projects`
- Supabase project: `zigbuogyerivbnxtnjjw` (`humanstudy-hub-dev`, existing production authority)
- Private schema: `forum`; never add it to the Supabase Data API exposed schemas
- Migration: web repository `supabase/migrations/20261024204023_forum_shared_auth.sql`
- Restricted login: `humanstudy_forum_shared`, no access to Hub public tables or `auth.users`
- Identity: `forum.HumanStudyAccounts` links Supabase UUIDs to native forum IDs
- Database identity: `humanstudy-forum`

The migration preserves all 99 source tables, including examples and deactivated test data.
Before importing, a rolled-back transaction ran twice on the target. All 64 imported rows
were checked using per-table SHA256 digests. The migration and import ran atomically.
The existing Hub accounts, tables and data were not replaced.

The retired source project is `cmcomuzjmiptqillffea`. Keep it available for rollback until
shared authentication and writes pass production acceptance, then pause it rather than
creating another paid compute instance. Do not delete it during this rollout.

## Server environment

| Variable | Value or purpose |
| --- | --- |
| `ENV_NAME` | `humanstudy` |
| `FORUM_TYPE` | `LessWrong` |
| `HUMANSTUDY_SITE_URL` | `https://forum.humanstudy-hub.com/` |
| `HUMANSTUDY_DATABASE_ID` | `humanstudy-forum` |
| `PG_URL` | Restricted shared-project pooler URL, encrypted production secret |
| `PG_SCHEMA` | `forum` |
| `PG_SSL_CA` | Official Supabase CA; full certificate and hostname verification |
| `PG_MAX_CONNECTIONS` | `2` per function instance |
| `HUMANSTUDY_HUB_AUTH` | `true` |
| `HUB_AUTH_ORIGIN` | `https://humanstudy-hub.com` |
| `SUPABASE_URL` | Existing Hub project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Existing Hub publishable key, never service-role key |
| `NODE_OPTIONS` | `--max-old-space-size=8192` |

Do not include `sslmode` in `PG_URL`; node-postgres otherwise replaces explicit TLS settings.
All forum tables have RLS and a policy restricted to the forum server role. Public, anon and
authenticated have no forum schema/table/function access. Functions have fixed search paths.
ForumMagnum's server authorizes ownership, drafts, moderation and GraphQL operations.
The runtime cannot create schema objects, roles or databases and does not own the tables.

## Accounts and email

Hub `/account` handles sign-in, registration, password recovery and explicit POST sign-out.
Both browser sites use secure HttpOnly `hub_access` and `hub_refresh` cookies scoped to
`.humanstudy-hub.com`. Only trusted production hosts belong under that domain. Preview
instances must not be configured to issue production parent-domain cookies.

Both servers verify Supabase `/auth/v1/user` and `hub_session_active` before authorizing a
shared browser session. The forum delegates refresh to Hub `/auth/refresh`, rather than
independently rotating refresh tokens. Desktop keeps its existing Supabase session storage;
sharing the account does not copy browser cookies or local desktop files into the forum.

Native forum passwords, login tokens, OAuth issuance, verification and reset flows are
disabled in shared mode. The existing main-project SMTP and central confirmation/reset
pages send account mail. The prior forum Resend key may remain encrypted for future
non-account notification mail, but is not a second signup/password system. No automatic
administrator promotion is performed when provisioning a forum profile.

## Build and rollout

Use Node 24.13+ and native Turbopack `next build`. Upstream webpack production rendering
currently fails with an internal Next router context error. Git auto-deploy remains disabled:
manual production deployments avoid unconfigured previews using production data.

Deploy the main-site shared account routes after the additive RPC migration; then deploy
forum shared auth and the new PG connection. Verify anonymous reading, real shared sessions,
refresh, logout/revocation, draft ownership and writes before pausing the source project.
Keep preview deployments protected.

Private local migration backup (not Git or Vercel upload):
`.humanstudy-data/hosted-backups/shared-auth-20261024/`, including a per-table manifest.
Encrypted values are maintained in Vercel; `vercel env pull` redacts sensitive values, so a
pulled file is not a complete credential backup. Prior deployments retain their immutable
environments. Never restore or deploy a redacted value as a real credential.

Do not promote the pre-migration forum deployment after new writes exist without reconciling
those writes: it points at the retired database. Roll back application code against the shared
schema where possible. The additive migration does not require dropping main-project tables.

Scheduled jobs, full-text search, image hosting and collaborative editing remain separate
feature configuration. Appoint a forum administrator and review moderation before wider launch.

## Advisor review

The session RPC intentionally uses a bounded SECURITY DEFINER lookup of `auth.sessions`:
no arguments, authenticated-only EXECUTE, fixed empty search path, caller UUID and session ID
both checked, boolean result only. Supabase's advisor flags authenticated callable definer
functions; this is an intentional reviewed endpoint, not a generic permission bypass.
The pre-existing leaked-password protection warning and ingestion-table no-policy information
are unrelated to this migration. No paid security feature was enabled as part of this task.
