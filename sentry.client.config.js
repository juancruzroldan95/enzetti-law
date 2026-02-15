import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://ba764ac3c6df29b30c78f11cb8f71948@o4509476670603264.ingest.us.sentry.io/4510891995365377",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});