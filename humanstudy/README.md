# HumanStudy Forum — first version

An independently runnable HumanStudy instance of the official
[ForumMagnum](https://github.com/ForumMagnum/ForumMagnum) repository. Upstream source revision:
`b453dfdafcbf86eaffafc0a581cfba131fbdb84c`. Branch: `codex/humanstudy-forum-v1`.
The original GPL-3.0 LICENSE and upstream history remain intact. The hosted forum is available at
https://forum.humanstudy-hub.com. The main website's `/forum` entry redirects to this independent app.
Local development remains available below. Deployment resources and configuration are documented
in [deployment.md](deployment.md).

The first hosted build, public discussion reading, native signup/password login, HttpOnly sessions,
private draft creation and guest access denial have passed verification. The synthetic acceptance
account and private draft were soft-deleted afterward. Email delivery
still needs a valid Resend sending key; registration verification and password reset are not yet
certified for this deployment. Native forum accounts are separate from HumanStudy Hub accounts.

## Product direction

Understanding people and society, together. Questions, observations, explanations and evidence
can all begin a conversation. Research assets can be linked using ordinary post links. No special
submission template, new research schema or mandatory experiment pipeline is imposed on a post.

The current version preserves the upstream visual system and layout, with a small instance configuration and color accent.
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
| Native header/navigation | `packages/lesswrong/components/layout/Header.tsx`, `components/common/TabNavigationMenu/menuTabs.tsx` |
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

## Current visual baseline

The forum now uses upstream typography, native Header and navigation drawer/sidebar, native
RouteRootClient column layout, original compact post rows. The custom
header, large introduction, boxed feed and row CSS overrides have been removed. Only a restrained
teal accent, four relevant navigation items and HumanStudy identity differ from the native chrome.
Upstream background artwork and seasonal banners are not mounted for this instance. Our own
Field notes illustration, teal wordmark and HumanStudy Hub palette establish the visual identity.
See `art-direction.md` for the original artwork, generation prompt and integration details.

The homepage uses native SingleColumnSection and PostsList2. A featured post is queried from the
actual database through `humanStudy.featuredPostId`; its title, author and description are not a
second hardcoded copy. The homepage shows a short reading preview with a link to the full article.
No stored post content is changed or shortened. Set the featured ID to null to omit the feature.

Current screenshot evidence: `home-branded-desktop.jpg` and `home-branded-mobile.jpg`. Earlier
screenshots remain as iteration history. Browser checks at 1280px and 375px confirm native layouts,
no horizontal overflow and a working Questions filter. Codegen, project types and changed-file lint
pass. Search remains hidden because the search service has not been configured.

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
