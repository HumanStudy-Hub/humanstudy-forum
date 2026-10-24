# Hosted HumanStudy Forum

The forum runs as a separate ForumMagnum application. The main website links to it through
`/forum`; it is not an iframe or a copy of the local preview database.

## Resources

- Repository: `HumanStudy-Hub/humanstudy-forum`
- Deployment branch: `codex/humanstudy-forum-v1`
- Vercel project: `humanstudy-forum`, in `xuanl17s-projects`
- Production alias: `https://humanstudy-forum.vercel.app`
- Intended custom domain: `forum.humanstudy-hub.com`
- Dedicated Supabase project: `humanstudy-forum` (`cmcomuzjmiptqillffea`, us-west-1)
- Database schema: upstream `schema/accepted_schema.sql`, initialized as `forum_initial_schema`
- Database identity: `humanstudy-forum`

No existing HumanStudy application tables, accounts or local testing data are imported.
The five labeled public examples in `humanstudy/examples.json` are the only initial discussions.
The forum initially has its own native accounts. Hub login is not single sign-on.

## Server environment

Store these in Vercel, never in Git or a client-visible environment variable:

| Variable | Purpose |
| --- | --- |
| `ENV_NAME` | `humanstudy` |
| `FORUM_TYPE` | `LessWrong`, retaining upstream behavior |
| `HUMANSTUDY_SITE_URL` | Canonical public URL, including trailing slash |
| `HUMANSTUDY_DATABASE_ID` | `humanstudy-forum` |
| `PG_URL` | Supabase transaction pooler URL for the restricted forum runtime role |
| `PG_SSL_CA` | Supabase production CA certificate; server verification stays enabled |
| `PG_MAX_CONNECTIONS` | `2` per function instance |
| `HUMANSTUDY_RESEND_API_KEY` | Email delivery credential |
| `private_defaultEmail` | Verified sender formatted as `HumanStudy Forum <address>` |
| `NODE_OPTIONS` | `--max-old-space-size=8192` for the upstream application build |
| `NEXT_TELEMETRY_DISABLED` | `1` |

Do not include `sslmode` in `PG_URL`: node-postgres would overwrite the explicit CA configuration.
All public tables have RLS enabled and no access grants for Supabase's `anon` or `authenticated`
roles. ForumMagnum authorizes requests through its native server; the dedicated runtime role owns
the forum tables but cannot create roles, databases or objects in the public schema.

The email adapter uses Resend for this instance and leaves other upstream instances unchanged.
Verification and reset links derive from `HUMANSTUDY_SITE_URL`; change it and redeploy when moving
to the custom domain. Add the DNS record Vercel recommends before changing the canonical URL.

## Deployment and verification

Use Node 24.13+ and the native Turbopack production build (`next build`). The upstream webpack
build currently fails during static rendering because of internal Next router context usage.
The local development seed command remains restricted to the local database.

```sh
vercel deploy --prod
```

Before updating the main-site link, verify the public homepage and an example article, native
signup/login, private draft access, and verification/reset email delivery. Keep preview deployments
protected. Never copy `.humanstudy-data`, local test accounts, environment files or credentials.

Upstream scheduled jobs are not enabled on this first deployment. Full-text search, image hosting,
collaborative editing and Hub single sign-on need separate configuration before advertising them.
Appoint a forum administrator before inviting a wider community, and review moderation and spam
controls before opening unrestricted registration to the public.
