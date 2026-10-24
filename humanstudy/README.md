# HumanStudy Forum — first version

An independently runnable HumanStudy instance of the official
[ForumMagnum](https://github.com/ForumMagnum/ForumMagnum) repository. Upstream source revision:
`b453dfdafcbf86eaffafc0a581cfba131fbdb84c`. Branch: `codex/humanstudy-forum-v1`.
The original GPL-3.0 LICENSE and upstream history remain intact. This is a local development
preview, not a deployed forum or a replacement for HumanStudy's current production website.

## Product direction

Understanding people and society, together. Questions, observations, explanations and evidence
can all begin a conversation. Research assets can be linked using ordinary post links. No special
submission template, new research schema or mandatory experiment pipeline is imposed on a post.

The first version is an instance configuration, a small theme, and a simpler default interface.
Upstream owns accounts, sessions, password hashing, post/comment mutations, editor revisions,
voting, bookmarks, moderation and reading collections. Do not introduce parallel implementations.

## Start locally

Use Node 24.13+ (see `.nvmrc`). From this repository:

```sh
npm run humanstudy:setup
npm run humanstudy:dev
```

Preview: http://127.0.0.1:3120. Use `HUMANSTUDY_FORUM_PORT=3121` to choose another HTTP port.
The database listener is localhost-only on port 55439. Data persists under `.humanstudy-data/`;
local tools are under `.humanstudy-tools/`. Both are ignored by Git. No connection to the shared
HumanStudy Supabase database is used, and no existing application account/session is imported.

Setup installs the pinned upstream dependencies without running the deployment-oriented root
postinstall, then builds password hashing and vendored Excalidraw and installs the collaboration
server dependencies. The dev command runs upstream codegen and starts Next directly, avoiding
`yarn start`'s upstream Vercel credential synchronization.

The local database is PGlite (Postgres WASM) with the official accepted schema, extensions and
socket adapter. It is only a local development convenience. Use dedicated native PostgreSQL with
pgvector and upstream connection-pool settings for a shared or production deployment. Do not
point this seed command at production; it requires both localhost and the humanstudy-local identity.

Five editable example discussions are seeded idempotently. Each is labeled as an example and
attributed to Example researcher. No votes, comments or community activity are invented. Original
example content lives in `humanstudy/examples.json`; remove demo content through a reviewed
migration before a public launch. Synthetic integration accounts/private drafts may also exist
in the local data folder; none is copied into Git.

## Where to extend

| Concern | File |
| --- | --- |
| Instance identity and integration settings | `packages/lesswrong/server/settings/humanStudy.ts` |
| Colors and typography | `packages/lesswrong/themes/humanStudyTheme.ts` |
| Header/navigation | `packages/lesswrong/components/humanstudy/HumanStudyHeader.tsx` |
| Homepage and native post feed | `packages/lesswrong/components/humanstudy/HumanStudyHome.tsx` |
| Reading collections | `packages/lesswrong/components/humanstudy/HumanStudyReading.tsx` |
| Scoped document/readability CSS | `app/humanstudy.css` |
| Startup and local fixtures | `scripts/humanstudy-*.mjs`, `humanstudy/examples.json` |

The upstream forum-type enum remains LessWrong, retaining native behavior. `ENV_NAME=humanstudy`
selects the instance, and `humanStudyForum` selects the lightweight interface/theme. Other upstream
instances retain their original settings and layouts. Changes to existing upstream files are
small conditional integration points. Keep `upstream` as the original read-only remote and add
our own remote before publishing changes. Update upstream in review branches and verify these
integration points rather than copying the entire UI into a second project.

## Verified in this version

- Real native GraphQL signup and login; login response sets an HttpOnly cookie.
- Real private draft creation and private comment creation through upstream mutations.
- Native database-backed homepage and question filter (five examples; two questions).
- Native article/revision reading, and a HumanStudy reading page using upstream sequence queries.
- TypeScript across the upstream application and changed-file ESLint.
- Desktop and narrow-layout visual checks. Screenshot evidence is under `humanstudy/screenshots/`.

These checks used only synthetic local data. They do not certify a production deployment.

## Visual refinement

The homepage now uses a compact introduction, a warm neutral canvas, and a white reading surface.
Native feed rows use a two-line hierarchy: serif title, followed by author, date and comment count.
The outline writing button and quieter navigation retain the HumanStudy teal accent.
No account, post, comment or sorting behavior changes in this refinement.

Screenshots in this directory document the initial version, before this visual refinement.
Codegen, project type checks and changed-file lint pass for the refinement. A fresh browser visual
check is pending because browser access to the local preview was rejected by the browser tool.

## Before opening a shared/public community

- Provision a dedicated persistent PostgreSQL database, domain and deployment. Review upstream
  database migrations and permissions. The embedded development database is not a public service.
- Configure our own email sender, verification/reset delivery, anti-spam, admins and moderation.
  Local testServer mode prints emails to the private local server log; it does not deliver them.
- Connect identity to HumanStudy only through a reviewed SSO design. Existing Hub accounts do not
  automatically work here. The first version uses ForumMagnum's independent account system.
- Native full-text search is inherited but its search service is not configured, so no search
  button is offered in the simplified header. Configure the upstream search backend before exposing it.
- OAuth buttons are hidden until our own providers are configured. Upstream CAPTCHA/GTM/Intercom
  identifiers are not used for this instance. Configure our own integrations before public launch.
- Image hosting, collaborative editing, notifications/email delivery, moderation and mobile editor
  need a full production walkthrough. Native code being present is not evidence they are configured.
- Confirm which sample content becomes real community guidance. Avoid claiming an active community
  or research findings from the seed fixtures.
