import { hashLoginToken, userIsBanned } from '@/server/loginTokens';
import { getHubUser, usesHubAuth } from '@/server/authentication/hubAuth';
import UsersRepo from '@/server/repos/UsersRepo';
import type { NextRequest } from 'next/server';

export const getUser = async (loginToken: string|null): Promise<DbUser|null> => {
  if (usesHubAuth() || !loginToken) return null;
  if (typeof loginToken !== 'string') throw new Error("Login token is not a string");

  const hashedToken = hashLoginToken(loginToken)

  const user = await new UsersRepo().getUserByLoginToken(hashedToken);
  if (!user) return null;
  if (userIsBanned(user)) return null;

  return user
};

export const getUserFromReq = async (req: NextRequest): Promise<DbUser | null> => {
  if (usesHubAuth()) return getHubUser(req.cookies.get('hub_access')?.value);
  // We check both cookies and headers, because requests from the browser come with cookies,
  // but requests made by the apollo client (even during SSR) have to send it via header
  const loginToken = req.cookies.get('loginToken')?.value ?? req.headers.get('loginToken') ?? null;
  return getUser(loginToken);
};
