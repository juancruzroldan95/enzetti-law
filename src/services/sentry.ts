import * as Sentry from "@sentry/astro";

interface CaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: CaptureContext): void {
  Sentry.captureException(error, context);
}
