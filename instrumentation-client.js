// @ts-check
// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/


const { getSentry } = require('@/lib/sentryWrapper');

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

  beforeSend: (event, hint) => {
    // Suppress an uninformative error from ReCaptcha
    // See: https://github.com/getsentry/sentry-javascript/issues/2514
    if (hint?.originalException === "Timeout") {
      return null;
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
