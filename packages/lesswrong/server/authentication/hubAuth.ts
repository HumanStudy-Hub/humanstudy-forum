import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import Users from '@/server/collections/users/collection';
import { randomId } from '@/lib/random';
import { userIsBanned } from '@/server/loginTokens';

export function usesHubAuth(): boolean {
  return process.env.HUMANSTUDY_HUB_AUTH === 'true';
}

export function requireNativeAuth(): void {
  if (usesHubAuth()) throw new Error('Use your HumanStudy account to manage sign-in and account security.');
}

export class HubAuthUnavailable extends Error {
  constructor() { super('HumanStudy sign-in is temporarily unavailable. Please try again.'); }
}

interface HubIdentity {
  id: string;
  email: string;
  email_confirmed_at: string;
  user_metadata?: { full_name?: string; name?: string };
}

export type HubSessionResult =
  | { status: 'authenticated'; identity: HubIdentity }
  | { status: 'expired' }
  | { status: 'anonymous' };

export async function verifyHubSession(accessToken: string | undefined): Promise<HubSessionResult> {
  if (!accessToken) return { status: 'anonymous' };
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !key) throw new Error('Shared HumanStudy authentication is not configured.');
  const headers = { apikey: key, Authorization: `Bearer ${accessToken}` };
  try {
    const response = await fetch(`${baseUrl}/auth/v1/user`, { headers, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (response.status === 401 || response.status === 403) return { status: 'expired' };
    if (!response.ok) throw new HubAuthUnavailable();
    const identity: HubIdentity = await response.json();
    if (typeof identity.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.id) || typeof identity.email !== 'string' || !identity.email || !identity.email_confirmed_at) return { status: 'anonymous' };
    const active = await fetch(`${baseUrl}/rest/v1/rpc/hub_session_active`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}',
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (active.status === 401) return { status: 'anonymous' };
    if (!active.ok) throw new HubAuthUnavailable();
    if (await active.json() !== true) return { status: 'anonymous' };
    return { status: 'authenticated', identity };
  } catch (error) {
    if (error instanceof HubAuthUnavailable) throw error;
    throw new HubAuthUnavailable();
  }
}

export async function getForumUserForHubIdentity(identity: HubIdentity): Promise<DbUser | null> {
  const db = getSqlClientOrThrow();
  const userId = await db.tx(async (transaction) => {
    await transaction.one('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [identity.id]);
    const existing = await transaction.oneOrNone<{ forum_user_id: string }>(
      'SELECT forum_user_id FROM "HumanStudyAccounts" WHERE auth_user_id = $1', [identity.id],
    );
    if (existing) {
      await transaction.none(`UPDATE "Users" SET email = $2, emails = ARRAY[jsonb_build_object('address', $2::text, 'verified', true)] WHERE _id = $1 AND email IS DISTINCT FROM $2`, [existing.forum_user_id, identity.email]);
      return existing.forum_user_id;
    }
    const legacy = await transaction.manyOrNone<{ _id: string }>(
      `SELECT u._id FROM "Users" u WHERE EXISTS (
        SELECT 1 FROM unnest(u.emails) e WHERE lower(e->>'address') = lower($1) AND e->>'verified' = 'true'
      ) AND NOT EXISTS (SELECT 1 FROM "HumanStudyAccounts" a WHERE a.forum_user_id = u._id) FOR UPDATE`, [identity.email],
    );
    if (legacy.length > 1) throw new Error('Please contact HumanStudy support to link your forum account.');
    const id = legacy[0]?._id ?? randomId();
    if (!legacy.length) {
      const profileName = [identity.user_metadata?.full_name, identity.user_metadata?.name].find(value => typeof value === 'string');
      const name = profileName?.trim().slice(0, 80) || 'Researcher';
      const username = `researcher-${id}`;
      await transaction.none(`INSERT INTO "Users" (_id, slug, username, "displayName", email, emails, services, "isAdmin", "abTestKey")
        VALUES ($1, $2, $2, $3, $4, ARRAY[jsonb_build_object('address', $4::text, 'verified', true)], '{}'::jsonb, false, $1)`, [id, username, name, identity.email]);
    }
    await transaction.none('INSERT INTO "HumanStudyAccounts" (auth_user_id, forum_user_id) VALUES ($1, $2)', [identity.id, id]);
    return id;
  });
  const user = await Users.findOne(userId);
  return user && !userIsBanned(user) && !user.deleted ? user : null;
}

export async function getHubUser(accessToken: string | undefined): Promise<DbUser | null> {
  const session = await verifyHubSession(accessToken);
  return session.status === 'authenticated' ? getForumUserForHubIdentity(session.identity) : null;
}
