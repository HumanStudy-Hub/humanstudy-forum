import { NextRequest, NextResponse } from 'next/server';
import { forumReturnPath } from '@/lib/auth/hubAuthLinks';
import { usesHubAuth } from '@/server/authentication/hubAuth';

export function GET(request: NextRequest) {
  if (!usesHubAuth()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const siteUrl = process.env.HUMANSTUDY_SITE_URL;
  const hubOrigin = process.env.HUB_AUTH_ORIGIN;
  if (!siteUrl || !hubOrigin) throw new Error('Shared HumanStudy authentication is not configured.');
  const returnTo = new URL(forumReturnPath(request.nextUrl.searchParams.get('returnTo')), siteUrl);
  const refresh = new URL('/auth/refresh', hubOrigin);
  refresh.searchParams.set('returnTo', returnTo.toString());
  const response = NextResponse.redirect(refresh);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
