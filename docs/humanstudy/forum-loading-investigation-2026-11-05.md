# Forum loading bug investigation — 2026-11-05

## Scope
Diagnose incorrect loading behavior before proposing performance changes. No production settings, database writes, paid resources or deployments changed.

## Confirmed defect
`createHttpLink` reversed its explicit batch-key ternary: all string keys returned the same transport-only key. Article queries (`singlePost`) and recommendations (`recommendations`) therefore shared a batch despite callers explicitly requesting isolation. Untagged queries formed another bucket with an accidental `undefined` suffix.

Extract the actual batching-key function into a dependency-light module. Include the explicit string key in an unambiguous tuple; ignore unsupported types. Preserve transport settings when grouping requests.

A regression test fails against the old expression. The integration test runs both operations through the actual streaming link and verifies two one-operation HTTP requests. All 10 batching/streaming tests pass.

This is a proven isolation defect, not proof that it explains every observed delay. The streaming protocol delivers completed operations separately, so sharing a batch alone does not establish response-level head-of-line blocking.

## Production observations
- Active deployment: dpl_6PJe4kLULbsYuEnqei7AUis8YqHn, Ready; created 2026-11-05, server functions iad1.
- Public one-post `/graphql` read: 7.678 s, repeated 0.902 s; responses valid.
- Equivalent `/api/streamGraphql` read: 3.221 s; valid complete response, HTTP200.
- Browser homepage and article initially show shell, then content arrives. No reproduced crash, infinite retry, or permanent spinner in this pass.
- Production log: `/analyticsEvent` reported `SELECT oid FROM pg_type WHERE typname = 'vector'` taking 4212 ms. This background initialization measurement can include connection setup; it does not prove the SQL execution itself took four seconds or blocked article rendering.
- Browser warnings only: gtag called before dataLayer initialization. No evidence this caused the delay.

## Validation limits / next diagnosis
Typecheck cannot complete in this fresh worktree because generated `.next/types/routes` and Excalidraw font artifacts are absent. ESLint fails before checking files due to installed ESLint8 loading an ESM stylistic plugin under local Node20. No errors from changed files appeared in the typecheck output. Do not treat these as full green checks.

Keep investigating cold versus warm requests, connection acquisition, and logged-in shared-auth latency separately. Do not change auth validation/caching, weaken session revocation, increase database spend, or declare the loading issue resolved based on these observations alone.

## Follow-up: homepage list is the reported symptom

The user clarified that the homepage shell appears before the list. The batching defect is not sufficient to explain this route: its feed query has no explicit batch key. Keep the confirmed fix separate from the primary loading investigation.

Eight sequential public read-only requests isolated the following timings (seconds):

| Request | First sample | Immediate repeat |
| --- | ---: | ---: |
| DB health (`SELECT 1`) | 0.681 | 0.252 |
| GraphQL `__typename` (no post lookup) | 4.870 | 0.404 |
| GraphQL one post | 0.786 | 0.238 |
| Streaming GraphQL one post | 4.752 | 0.216 |

These are observed samples, not forced cold starts or a controlled benchmark. They strongly suggest a first-use server initialization path; they do not isolate module import, GraphQL schema construction, connection establishment, or platform scheduling individually. `getExecutableSchema()` memoizes schema construction once per module instance. Both full and streaming endpoints depend on the full resolver graph.

A streamed homepage HTML probe received its shell at 6.672 s, post names at 7.402 s and EOF at 7.456 s. The response contains the post data, so that reproduction did not require a second client request to obtain the initial list.

All 61 homepage JavaScript script URLs returned HTTP200. Each of those individual transfers was under 0.27 s in the five-worker probe. That does not measure browser parse/hydration time, but rules out missing deployment chunks in this pass.

Supabase project is ACTIVE_HEALTHY in us-west-1; deployed server functions are iad1. The cross-region placement is confirmed, but alone does not explain a four-second first-use gap. A read-only pg_stat_activity snapshot showed no lock waiters or other active long-running queries (ten idle connections). This snapshot does not rule out earlier saturation. No upgrade or database change was made.

Next diagnostic requirement: correlate homepage request timings with server module/schema initialization and SSR feed execution. Do not change the feed permissions or cache personalized results as a shortcut. The primary homepage delay is still unresolved.
