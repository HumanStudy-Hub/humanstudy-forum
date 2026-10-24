import { usesHubAuth } from '@/server/authentication/hubAuth';
import { hubAccountUrl } from '@/lib/auth/hubAuthLinks';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSiteUrlFromReq } from '@/server/utils/getSiteUrl';
import { hashLoginToken } from '@/server/loginTokens';
import { invalidateLoginToken } from '@/server/vulcan-lib/apollo-server/authentication';

const loginTokenCookieNames = ['meteor_login_token', 'loginToken'];

export async function GET(request: NextRequest) {
  if (usesHubAuth()) {
    const hubOrigin = process.env.HUB_AUTH_ORIGIN;
    const siteUrl = process.env.HUMANSTUDY_SITE_URL;
    if (!hubOrigin || !siteUrl) throw new Error('Shared HumanStudy authentication is not configured.');
    return NextResponse.redirect(hubAccountUrl(hubOrigin, siteUrl, 'logout'));
  }
  const cookieStore = await cookies();
  const siteUrl = getSiteUrlFromReq(request);

  // Revoke login tokens server-side, so that they can't be reused even if
  // a copy of the cookie survives on the client
  for (const cookieName of loginTokenCookieNames) {
    const loginToken = cookieStore.get(cookieName)?.value;
    if (loginToken) {
      await invalidateLoginToken(hashLoginToken(loginToken));
    }
  }

  // Clear authentication cookies
  const cookiesToClear = [...loginTokenCookieNames, 'connect.sid'];

  cookiesToClear.forEach(cookieName => {
    // Check if cookie exists before trying to delete it
    if (cookieStore.has(cookieName)) {
      cookieStore.delete({
        name: cookieName,
        path: '/',
      });
    }
  });

  // Otherwise redirect to homepage
  return NextResponse.redirect(new URL('/', siteUrl));
}

// Support POST method as well for forms that might use it
export async function POST(request: NextRequest) {
  return GET(request);
}
