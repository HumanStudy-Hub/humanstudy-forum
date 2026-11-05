-- Remove the five seeded "Example researcher" posts (hsExample*).
-- Uses ForumMagnum's own soft delete (draft + deletedDraft), the same thing the
-- "Delete" menu item does, so it is reversible by setting both back to false.
-- Production: run against the `forum` schema. Local PGlite: drop the SET line.
SET search_path TO forum;

BEGIN;

UPDATE "Posts"
SET draft = true, "deletedDraft" = true, "modifiedAt" = now()
WHERE "userId" = 'hsExampleResearcher001';

-- Expect 5 rows, all draft = true and deletedDraft = true.
SELECT _id, title, draft, "deletedDraft" FROM "Posts" WHERE "userId" = 'hsExampleResearcher001';

COMMIT;
