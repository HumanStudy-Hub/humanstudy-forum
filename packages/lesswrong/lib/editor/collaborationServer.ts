/**
 * Whether a Hocuspocus collaboration server is configured for this build.
 *
 * `NEXT_PUBLIC_HOCUSPOCUS_URL` is inlined at build time (see next.config.ts,
 * which derives it from `HOCUSPOCUS_URL`). Deployments without a Hocuspocus
 * server must fall back to single-author, non-collaborative Lexical editing,
 * where contents are saved through the normal form submit instead of Yjs.
 *
 * Keep the `process.env.NEXT_PUBLIC_HOCUSPOCUS_URL` expression literal so the
 * build-time replacement still applies.
 */
export function isCollaborationServerConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
}
