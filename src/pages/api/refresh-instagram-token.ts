import type { APIRoute } from "astro";
import { captureException, withCronMonitor } from "@services/sentry";
import { refreshInstagramToken } from "@services/instagram";
import { updateEnvVar, redeployLatestProduction } from "@services/vercel";
import { withRetry } from "@utils/retry";

const CRON_SCHEDULE = "0 13 * * 1"; // Every Monday at 13:00 UTC (matches vercel.json)

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      const error = new Error("Instagram token refresh unauthorized: invalid or missing CRON_SECRET");
      captureException(error, {
        tags: { service: "instagram-cron" },
        extra: { hasCronSecret: !!cronSecret, hasAuthHeader: !!authHeader },
      });
      return new Response("Unauthorized", { status: 401 });
    }

    const envId = process.env.VERCEL_INSTAGRAM_ENV_ID || import.meta.env.VERCEL_INSTAGRAM_ENV_ID;
    if (!envId) {
      const error = new Error("Missing VERCEL_INSTAGRAM_ENV_ID environment variable");
      captureException(error, { tags: { service: "instagram-cron" } });
      return new Response("Missing VERCEL_INSTAGRAM_ENV_ID", { status: 500 });
    }

    // Wrap the three-step logic in a Sentry Cron Monitor.
    // checkinMargin defaults to 90 min to cover Vercel Hobby plan's ±1h execution imprecision.
    await withCronMonitor("refresh-instagram-token", CRON_SCHEDULE, async () => {
      // Step 1: Refresh the Instagram long-lived token (with 3 retries)
      const newToken = await withRetry(() => refreshInstagramToken(), 3, 2000);
      console.log("Instagram token refreshed successfully");

      // Step 2: Update the token in Vercel (with 3 retries)
      await withRetry(() => updateEnvVar(envId, newToken), 3, 2000);
      console.log("Vercel INSTAGRAM_ACCESS_TOKEN updated successfully");

      // Step 3: Redeploy to pick up the new token (with 3 retries)
      await withRetry(() => redeployLatestProduction(), 3, 2000);
      console.log("Vercel redeploy triggered successfully");
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Instagram token refreshed, Vercel env updated, and redeploy triggered",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    captureException(err, {
      tags: { service: "instagram-cron" },
      extra: { errorMessage: err?.message || String(err) },
    });
    return new Response(
      JSON.stringify({ error: err?.message || "Instagram cron failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
