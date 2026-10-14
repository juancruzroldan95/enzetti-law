import type { APIRoute } from "astro";
import { captureException, flushTelemetry, logger, withCronMonitor, type LogAttributes } from "@services/sentry";
import { refreshInstagramToken } from "@services/instagram";
import { updateEnvVar, redeployLatestProduction } from "@services/vercel";
import { withRetry } from "@utils/retry";

const CRON_SCHEDULE = "0 13 * * 1"; // Every Monday at 13:00 UTC (matches vercel.json)

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const startedAt = Date.now();
  const context = { service: "instagram-cron", run_id: crypto.randomUUID() };
  let step = "authorization";

  async function runStep<T>(name: string, fn: (attributes: LogAttributes) => Promise<T>): Promise<T> {
    step = name;
    let attempt = 0;
    const result = await withRetry(async () => {
      attempt++;
      const attemptStartedAt = Date.now();
      const attributes = { ...context, step: name, attempt };
      logger.info("cron.step.started", attributes);
      try {
        const value = await fn(attributes);
        logger.info("cron.step.completed", { ...attributes, duration_ms: Date.now() - attemptStartedAt });
        return value;
      } catch (error: unknown) {
        logger.warn("cron.step.failed", {
          ...attributes,
          duration_ms: Date.now() - attemptStartedAt,
          // Do not log arbitrary error messages, which may contain tokens.
          error_type: error instanceof Error ? error.name : "UnknownError",
          will_retry: attempt < 3,
        });
        throw error;
      } finally {
        // Persist progress even if a later step is killed by the runtime.
        await flushTelemetry();
      }
    }, 3, 2000);
    return result;
  }

  try {
    const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("cron.authorization.failed", {
        ...context, step, has_cron_secret: !!cronSecret, has_auth_header: !!authHeader,
      });
      const error = new Error("Instagram token refresh unauthorized: invalid or missing CRON_SECRET");
      captureException(error, {
        tags: { ...context, step },
        extra: { hasCronSecret: !!cronSecret, hasAuthHeader: !!authHeader },
      });
      return new Response("Unauthorized", { status: 401 });
    }

    logger.info("cron.started", context);
    await flushTelemetry();
    step = "configuration";

    // Wrap the three-step logic in a Sentry Cron Monitor.
    // checkinMargin defaults to 90 min to cover Vercel Hobby plan's ±1h execution imprecision.
    const renewal = await withCronMonitor("refresh-instagram-token", CRON_SCHEDULE, async () => {
      const envId = process.env.VERCEL_INSTAGRAM_ENV_ID || import.meta.env.VERCEL_INSTAGRAM_ENV_ID;
      const vercelToken = process.env.VERCEL_TOKEN || import.meta.env.VERCEL_TOKEN;
      const projectId = process.env.VERCEL_PROJECT_ID || import.meta.env.VERCEL_PROJECT_ID;
      if (!envId || !vercelToken || !projectId) {
        throw new Error("Missing Vercel credentials for Instagram token renewal");
      }

      // Step 1: Refresh the Instagram long-lived token (with 3 retries)
      const refreshed = await runStep("refresh_token", () => refreshInstagramToken());
      logger.info("cron.token.renewed", { ...context, expires_at: refreshed.expiresAt, expires_in: refreshed.expiresIn });

      // Step 2: Update the token in Vercel (with 3 retries)
      await runStep("update_environment", (attributes) => updateEnvVar(envId, refreshed.accessToken, attributes));

      // Step 3: Redeploy to pick up the new token (with 3 retries)
      await runStep("redeploy", (attributes) => redeployLatestProduction(attributes));
      return { expiresAt: refreshed.expiresAt, expiresIn: refreshed.expiresIn };
    });

    logger.info("cron.completed", { ...context, duration_ms: Date.now() - startedAt });

    return new Response(
      JSON.stringify({
        success: true,
        ...renewal,
        message: "Instagram token refreshed, Vercel env updated, and redeploy triggered",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    logger.error("cron.failed", { ...context, step, duration_ms: Date.now() - startedAt });
    captureException(err, {
      tags: { ...context, step },
    });
    return new Response(
      JSON.stringify({ error: "Instagram token renewal failed. Check Sentry for details." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await flushTelemetry();
  }
};
