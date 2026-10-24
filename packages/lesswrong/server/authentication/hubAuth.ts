import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import Users from '@/server/collections/users/collection';
import { getOrCreateHubForumUserId } from './hubAccountMapping';
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
  const profileName = [identity.user_metadata?.full_name, identity.user_metadata?.name].find(value => typeof value === 'string');
  const userId = await getOrCreateHubForumUserId(db, {
    id: identity.id,
    email: identity.email,
    displayName: profileName?.trim().slice(0, 80) || 'Researcher',
  });
  const user = await Users.findOne(userId);
  return user && !userIsBanned(user) && !user.deleted ? user : null;
}

export async function getHubUser(accessToken: string | undefined): Promise<DbUser | null> {
  const session = await verifyHubSession(accessToken);
  return session.status === 'authenticated' ? getForumUserForHubIdentity(session.identity) : null;
}
