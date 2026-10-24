import pgPromise from 'pg-promise';
import { getOrCreateHubForumUserId } from '../server/authentication/hubAccountMapping';

const pgp = pgPromise();
const testUrl = process.env.HUB_AUTH_TEST_PG_URL ?? process.env.PG_URL;
if (!testUrl || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(testUrl).hostname)) {
  throw new Error('Hub account mapping regression tests require a local PostgreSQL database.');
}
const db = pgp({ connectionString: testUrl, max: 1 });

async function prepareTemporaryTables(transaction: pgPromise.ITask<{}>) {
  await transaction.none('DROP TABLE IF EXISTS pg_temp."HumanStudyAccounts", pg_temp."Posts", pg_temp."Users"');
  await transaction.none('CREATE TEMP TABLE "Users" (LIKE public."Users" INCLUDING DEFAULTS) ON COMMIT DROP');
  await transaction.none('ALTER TABLE pg_temp."Users" ADD PRIMARY KEY (_id)');
  await transaction.none(`CREATE TEMP TABLE "HumanStudyAccounts" (
    auth_user_id uuid PRIMARY KEY,
    forum_user_id varchar(27) UNIQUE REFERENCES pg_temp."Users"(_id)
  ) ON COMMIT DROP`);
  await transaction.none('CREATE TEMP TABLE "Posts" (LIKE public."Posts" INCLUDING DEFAULTS) ON COMMIT DROP');
}

const firstIdentity = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'researcher@example.invalid',
  displayName: 'Researcher',
};

afterAll(async () => {
  await db.none('DROP TABLE IF EXISTS pg_temp."HumanStudyAccounts", pg_temp."Posts", pg_temp."Users"');
  await db.$pool.end();
});

describe('shared forum identity ownership', () => {
  it('never assigns an orphaned profile or private draft to a new UUID reusing its verified email', async () => {
    await db.tx(async transaction => {
      await prepareTemporaryTables(transaction);
      const originalId = await getOrCreateHubForumUserId(transaction, firstIdentity);
      await transaction.none(`INSERT INTO "Posts" (_id, slug, "postedAt", title, "lastCommentedAt", status, "isFuture", "userId", "maxBaseScore", draft)
        VALUES ('privateDraft', 'private-draft', now(), 'Private draft', now(), 2, false, $1, 0, true)`, [originalId]);
      await transaction.none('DELETE FROM "HumanStudyAccounts" WHERE auth_user_id = $1', [firstIdentity.id]);
      const replacementId = await getOrCreateHubForumUserId(transaction, {
        ...firstIdentity, id: '22222222-2222-4222-8222-222222222222',
      });
      expect(replacementId).not.toBe(originalId);
      const draft = await transaction.one<{ userId: string; draft: boolean }>('SELECT "userId", draft FROM "Posts" WHERE _id = $1', ['privateDraft']);
      expect(draft.userId).toBe(originalId);
      expect(draft.draft).toBe(true);
      const ownedDrafts = await transaction.manyOrNone('SELECT _id FROM "Posts" WHERE "userId" = $1', [replacementId]);
      expect(ownedDrafts).toHaveLength(0);
    });
  });

  it('keeps the same UUID attached to one non-admin profile when its email changes', async () => {
    await db.tx(async transaction => {
      await prepareTemporaryTables(transaction);
      const originalId = await getOrCreateHubForumUserId(transaction, firstIdentity);
      const updatedId = await getOrCreateHubForumUserId(transaction, { ...firstIdentity, email: 'changed@example.invalid' });
      expect(updatedId).toBe(originalId);
      const profile = await transaction.one<{ email: string; isAdmin: boolean; services: object }>('SELECT email, "isAdmin", services FROM "Users" WHERE _id = $1', [updatedId]);
      expect(profile.email).toBe('changed@example.invalid');
      expect(profile.isAdmin).toBe(false);
      expect(profile.services).toEqual({});
    });
  });
});
