import { redirect } from 'next/navigation';
import { usesHubAuth } from '@/server/authentication/hubAuth';
import { hubAccountUrl } from '@/lib/auth/hubAuthLinks';
import React from "react";
import PasswordResetPage from '@/components/users/PasswordResetPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/resetPassword/[token]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ token: string }>
}) {
  if (usesHubAuth()) redirect(hubAccountUrl(process.env.HUB_AUTH_ORIGIN ?? 'https://humanstudy-hub.com', process.env.HUMANSTUDY_SITE_URL ?? 'https://forum.humanstudy-hub.com/', 'recovery'));
  const { token } = await params;
  return <RouteRoot>
    <PasswordResetPage token={token} />
  </RouteRoot>
}
