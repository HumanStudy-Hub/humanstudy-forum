import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { usesCurationEmailsCron } from '@/lib/betas';
import { dispatchPendingEvents } from '@/server/debouncer';
import { checkAndSendUpcomingEventEmails } from '@/server/eventReminders';
import { updateScoreActiveDocuments } from '@/server/votingCron';
import { getLockOrAbort } from '@/server/utils/advisoryLockUtil';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  const context = createAnonymousContext({ forumType: getForumTypeForRequest(request) });

  const isTestServer = testServerSetting.get(context);

  // Run these one at a time: each lock holds a pooled connection for the
  // whole job, and with a small pool (PG_MAX_CONNECTIONS=2) running them in
  // parallel leaves the jobs themselves no connection to query with.

  // Send curation emails
  if (!isTestServer && usesCurationEmailsCron(context.forumType)) {
    await getLockOrAbort('sendCurationEmails', sendCurationEmails);
  }

  // Debounced event handler
  if (!isTestServer) {
    await getLockOrAbort('dispatchPendingEvents', dispatchPendingEvents);
  }

  // Check upcoming event emails
  if (!isTestServer) {
    await getLockOrAbort('checkAndSendUpcomingEventEmails', checkAndSendUpcomingEventEmails.bind(null, context.forumType));
  }

  // Update score active documents (runs regardless of test server setting)
  await getLockOrAbort('updateScoreActiveDocuments', updateScoreActiveDocuments);

  return new Response('OK', { status: 200 });
}
