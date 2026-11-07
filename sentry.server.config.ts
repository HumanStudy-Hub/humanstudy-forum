// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { getSentry } from "@/lib/sentryWrapper";

const Sentry = getSentry();

Sentry?.init({
  // HumanStudy: the DSN comes from the environment. Without it, Sentry stays off
  // (the upstream file hard-coded LessWrong's own Sentry project).
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV ?? "development",
  integrations: [
    Sentry.dedupeIntegration(),
    Sentry.extraErrorDataIntegration(),
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
