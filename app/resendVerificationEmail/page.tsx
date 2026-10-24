import { redirect } from 'next/navigation';
import { usesHubAuth } from '@/server/authentication/hubAuth';
import { hubAccountUrl } from '@/lib/auth/hubAuthLinks';
import React from "react";
import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/resendVerificationEmail", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields('Email Verification'));
}

export default function Page() {
  if (usesHubAuth()) redirect(hubAccountUrl(process.env.HUB_AUTH_ORIGIN ?? 'https://humanstudy-hub.com', process.env.HUMANSTUDY_SITE_URL ?? 'https://forum.humanstudy-hub.com/'));
  return <RouteRoot>
    <ResendVerificationEmailPage />
  </RouteRoot>;
}
