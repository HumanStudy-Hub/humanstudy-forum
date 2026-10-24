import { randomId } from '@/lib/random';

interface HubAccountIdentity {
  id: string;
  email: string;
  displayName: string;
}

export function getOrCreateHubForumUserId(db: Pick<SqlClient, 'tx'>, identity: HubAccountIdentity): Promise<string> {
  return db.tx(async (transaction) => {
    await transaction.one('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [identity.id]);
    const existing = await transaction.oneOrNone<{ forum_user_id: string }>(
      'SELECT forum_user_id FROM "HumanStudyAccounts" WHERE auth_user_id = $1', [identity.id],
    );
    if (existing) {
      await transaction.none(`UPDATE "Users" SET email = $2, emails = ARRAY[jsonb_build_object('address', $2::text, 'verified', true)] WHERE _id = $1 AND email IS DISTINCT FROM $2`, [existing.forum_user_id, identity.email]);
      return existing.forum_user_id;
    }
    const id = randomId();
    const username = `researcher-${id}`;
    await transaction.none(`INSERT INTO "Users" (_id, slug, username, "displayName", email, emails, services, "isAdmin", "abTestKey")
      VALUES ($1, $2, $2, $3, $4, ARRAY[jsonb_build_object('address', $4::text, 'verified', true)], '{}'::jsonb, false, $1)`, [id, username, identity.displayName, identity.email]);
    await transaction.none('INSERT INTO "HumanStudyAccounts" (auth_user_id, forum_user_id) VALUES ($1, $2)', [identity.id, id]);
    return id;
  });
}
