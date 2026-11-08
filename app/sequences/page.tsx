import React from "react";
import CoreSequences from '@/components/sequences/CoreSequences';
import HumanStudyReading from '@/components/humanstudy/HumanStudyReading';
import { humanStudyForumSetting } from '@/lib/instanceSettings';
import { getForumTypeForPage } from '@/server/utils/pageUtil';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  // HumanStudy has no core sequence; /sequences lists the community's collections.
  const title = humanStudyForumSetting.get(await getForumTypeForPage()) ? 'Reading together' : 'Rationality: A-Z';
  return merge({}, await getDefaultMetadata(), await getPageTitleFields(title));
}

assertRouteAttributes("/sequences", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page() {
  const forumType = await getForumTypeForPage();
  return <RouteRoot>
    {humanStudyForumSetting.get(forumType) ? <HumanStudyReading /> : <CoreSequences />}
  </RouteRoot>
}
