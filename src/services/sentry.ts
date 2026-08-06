import * as Sentry from "@sentry/astro";

interface CaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: CaptureContext): void {
  Sentry.captureException(error, context);
}

/**
 * Wraps an async function with a Sentry Cron Monitor check-in.
 * Automatically reports in_progress → ok/error to Sentry.
 *
 * @param monitorSlug - Unique slug for the monitor in Sentry dashboard
 * @param cronExpression - Cron schedule (e.g. "0 13 * * 1") so Sentry knows when to expect it
 * @param checkinMarginMinutes - Minutes to wait past the schedule before marking as missed (default: 90 to cover Vercel Hobby ±1h imprecision)
 * @param fn - The async function to execute and monitor
 */
export async function withCronMonitor<T>(
  monitorSlug: string,
  cronExpression: string,
  fn: () => Promise<T>,
  checkinMarginMinutes = 90
): Promise<T> {
  return Sentry.withMonitor(
    monitorSlug,
    fn,
    {
      schedule: { type: "crontab", value: cronExpression },
      checkinMargin: checkinMarginMinutes,
      maxRuntime: 10, // alert if the job runs for more than 10 minutes
      timezone: "UTC",
    }
  );
}
