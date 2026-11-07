// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
